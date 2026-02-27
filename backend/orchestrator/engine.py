from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from backend.codex_runner.runner import CodexRunner, file_sha256
from backend.event_bus import EventBus
from backend.orchestrator.state_machine import STEP_DEFINITIONS
from backend.storage import Database, now_iso


@dataclass
class RunControl:
    resume_event: asyncio.Event = field(default_factory=asyncio.Event)
    cancel_requested: bool = False
    task: asyncio.Task[Any] | None = None


class RunOrchestrator:
    def __init__(self, db: Database, event_bus: EventBus, workspace_root: Path) -> None:
        self.db = db
        self.event_bus = event_bus
        self.workspace_root = workspace_root
        self.runner = CodexRunner()
        self.max_retries = 2
        self._controls: dict[str, RunControl] = {}

    def create_run(self, project_id: str) -> dict[str, Any]:
        run = self.db.create_run(
            project_id,
            [
                {
                    "key": step.key,
                    "number": step.number,
                    "title": step.title,
                    "codex_enabled": step.codex_enabled,
                }
                for step in STEP_DEFINITIONS
            ],
        )
        return run

    def start_run(self, run_id: str) -> None:
        control = self._controls.setdefault(run_id, RunControl())
        control.resume_event.set()
        control.cancel_requested = False

        if control.task and not control.task.done():
            return

        control.task = asyncio.create_task(self._execute_run(run_id))

    async def apply_control(self, run_id: str, action: str) -> dict[str, Any]:
        control = self._controls.setdefault(run_id, RunControl())

        if action == "pause":
            control.resume_event.clear()
            self.db.update_run(run_id, status="paused")
            run = self.db.get_run(run_id)
            if run:
                await self.event_bus.publish(run_id, "step_updated", {"run": run})
            return {"status": "ok", "message": "Run paused"}

        if action == "resume":
            control.resume_event.set()
            run = self.db.get_run(run_id)
            if run and run["status"] in {"paused", "pending"}:
                self.db.update_run(run_id, status="running")
            if control.task is None or control.task.done():
                self.start_run(run_id)
            return {"status": "ok", "message": "Run resumed"}

        if action == "cancel":
            control.cancel_requested = True
            control.resume_event.set()
            return {"status": "ok", "message": "Run cancellation requested"}

        if action == "retry":
            self.db.reset_failed_steps_for_retry(run_id)
            control.cancel_requested = False
            control.resume_event.set()
            self.start_run(run_id)
            return {"status": "ok", "message": "Retry started"}

        return {"status": "error", "message": f"Unknown action: {action}"}

    def get_stats_view(self, run_id: str) -> dict[str, Any]:
        stats = self.db.get_stats(run_id)
        if not stats:
            return {
                "runId": run_id,
                "hypothesis": 0,
                "papers": 0,
                "tokens": "0",
                "cost": "0.00",
                "elapsedTime": "00:00:00",
                "tokenCostUsd": 0,
                "gpuHours": 0,
            }
        return {
            "runId": run_id,
            "hypothesis": stats["hypothesis"],
            "papers": stats["papers"],
            "tokens": self._format_tokens(stats["tokens"]),
            "cost": f"{stats['costUsd']:.2f}",
            "elapsedTime": self._format_duration(stats["elapsedSeconds"]),
            "tokenCostUsd": round(stats["tokenCostUsd"], 4),
            "gpuHours": round(stats["gpuHours"], 4),
        }

    async def _execute_run(self, run_id: str) -> None:
        run = self.db.get_run(run_id)
        if not run:
            return

        control = self._controls.setdefault(run_id, RunControl())
        control.resume_event.set()

        if run["startedAt"] is None:
            self.db.update_run(run_id, started_at=now_iso())
        self.db.update_run(run_id, status="running")

        run = self.db.get_run(run_id)
        if run:
            await self.event_bus.publish(run_id, "run_started", {"run": run})

        steps = self.db.list_steps(run_id)
        start_index = next((idx for idx, step in enumerate(steps) if step["status"] != "completed"), len(steps))

        for index in range(start_index, len(steps)):
            await control.resume_event.wait()
            if control.cancel_requested:
                self.db.update_run(run_id, status="failed", ended_at=now_iso())
                run = self.db.get_run(run_id)
                if run:
                    await self.event_bus.publish(run_id, "run_failed", {"run": run, "reason": "cancelled"})
                return

            step = steps[index]
            step_id = step["id"]
            step_key = step["stepKey"]

            success = False
            attempt = 0
            while not success and attempt <= self.max_retries:
                attempt += 1
                self.db.update_run(run_id, status="running", current_step_index=index)
                self.db.update_step(step_id, status="running", started_at=now_iso(), ended_at=None, error_message=None)

                current_step = self.db.get_step_by_key(run_id, step_key)
                if current_step:
                    await self.event_bus.publish(run_id, "step_updated", {"step": current_step})

                result = self._execute_step(run, run_id, step_key, attempt)

                for log in result.logs:
                    job = self.db.add_job(
                        run_id=run_id,
                        step_id=step_id,
                        title=log["title"],
                        content=log["content"],
                        status=log["status"],
                        worked_for=log["workedFor"],
                        source=log["source"],
                        level=log["level"],
                        raw=log["raw"],
                    )
                    await self.event_bus.publish(run_id, "job_log_appended", {"job": job})

                self._update_stats(run_id, step_key, result.metrics)
                await self.event_bus.publish(run_id, "stats_updated", {"stats": self.get_stats_view(run_id)})

                for artifact_path in result.artifacts:
                    try:
                        rel_path = artifact_path.relative_to(self.workspace_root.parent)
                    except ValueError:
                        rel_path = artifact_path.name
                    artifact = self.db.add_artifact(
                        run_id=run_id,
                        step_id=step_id,
                        path=str(rel_path),
                        size=artifact_path.stat().st_size,
                        sha256=file_sha256(artifact_path),
                    )
                    await self.event_bus.publish(run_id, "artifact_created", {"artifact": artifact})

                if result.status == "success":
                    self.db.update_step(step_id, status="completed", ended_at=now_iso(), error_message=None)
                    completed_step = self.db.get_step_by_key(run_id, step_key)
                    if completed_step:
                        await self.event_bus.publish(run_id, "step_updated", {"step": completed_step})
                    success = True
                    continue

                if result.retriable and attempt <= self.max_retries:
                    self.db.update_step(
                        step_id,
                        status="error",
                        error_message=f"{result.summary}; retry {attempt}/{self.max_retries}",
                    )
                    failed_step = self.db.get_step_by_key(run_id, step_key)
                    if failed_step:
                        await self.event_bus.publish(run_id, "step_updated", {"step": failed_step})
                    await asyncio.sleep(0.4)
                    continue

                self.db.update_step(step_id, status="error", ended_at=now_iso(), error_message=result.summary)
                failed_step = self.db.get_step_by_key(run_id, step_key)
                if failed_step:
                    await self.event_bus.publish(run_id, "step_updated", {"step": failed_step})
                self.db.update_run(run_id, status="failed", ended_at=now_iso())
                failed_run = self.db.get_run(run_id)
                if failed_run:
                    await self.event_bus.publish(run_id, "run_failed", {"run": failed_run, "reason": result.summary})
                return

            steps = self.db.list_steps(run_id)

        self.db.update_run(run_id, status="completed", ended_at=now_iso(), current_step_index=len(steps) - 1)
        run = self.db.get_run(run_id)
        if run:
            self.db.update_project_status(run["projectId"], "completed")
            await self.event_bus.publish(
                run_id,
                "run_completed",
                {
                    "run": run,
                    "stats": self.get_stats_view(run_id),
                    "artifacts": self.db.list_artifacts(run_id),
                },
            )

    def _execute_step(self, run: dict[str, Any], run_id: str, step_key: str, attempt: int):
        workspace_dir = self.workspace_root / run["projectId"] / run_id / step_key
        workspace_dir.mkdir(parents=True, exist_ok=True)

        task_spec = {
            "goal": f"Complete step {step_key}",
            "context": {
                "run_id": run_id,
                "project_id": run["projectId"],
                "step": step_key,
            },
            "constraints": {
                "public_data_only": True,
                "budget_usd": 100,
                "time_limit_min": 10,
            },
            "allowed_actions": ["read", "write", "analyze", "report"],
            "expected_outputs": ["step_state.json"],
            "acceptance_checks": ["emit_openfars_result_block"],
        }

        task_file = workspace_dir / "task_spec.json"
        task_file.write_text(json.dumps(task_spec, indent=2, ensure_ascii=False), encoding="utf-8")

        result = self.runner.run_step(
            task_spec=task_spec,
            step_key=step_key,
            workspace_dir=workspace_dir,
            attempt=attempt,
        )

        checkpoint = {
            "step": step_key,
            "attempt": attempt,
            "status": result.status,
            "summary": result.summary,
        }
        (workspace_dir / "step_state.json").write_text(json.dumps(checkpoint, indent=2), encoding="utf-8")
        return result

    def _update_stats(self, run_id: str, step_key: str, metrics: dict[str, Any]) -> None:
        stats = self.db.get_stats(run_id)
        if not stats:
            return

        hypothesis_increment = 0
        papers_increment = 0
        if step_key == "topic_scoping":
            hypothesis_increment = 30
        elif step_key == "literature_review":
            papers_increment = 24
        elif step_key in {"hypothesis_generation", "experiment_planning"}:
            hypothesis_increment = 18

        updated = {
            "hypothesis": stats["hypothesis"] + hypothesis_increment,
            "papers": stats["papers"] + papers_increment,
            "tokens": stats["tokens"] + int(metrics.get("tokens", 0)),
            "cost_usd": stats["costUsd"] + float(metrics.get("cost_usd", 0.0)),
            "elapsed_seconds": stats["elapsedSeconds"] + 12,
            "token_cost_usd": stats["tokenCostUsd"] + float(metrics.get("token_cost_usd", 0.0)),
            "gpu_hours": stats["gpuHours"] + float(metrics.get("gpu_hours", 0.0)),
        }
        self.db.update_stats(run_id, **updated)

    @staticmethod
    def _format_tokens(value: int) -> str:
        if value >= 1_000_000_000:
            return f"{value / 1_000_000_000:.1f}B"
        if value >= 1_000_000:
            return f"{value / 1_000_000:.1f}M"
        if value >= 1_000:
            return f"{value / 1_000:.1f}K"
        return str(value)

    @staticmethod
    def _format_duration(total_seconds: int) -> str:
        days = total_seconds // 86400
        hours = (total_seconds % 86400) // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        if days > 0:
            return f"{days}:{hours:02d}:{minutes:02d}:{seconds:02d}"
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
