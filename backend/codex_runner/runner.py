from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .parser import parse_openfars_result


@dataclass
class StepExecutionResult:
    status: str
    summary: str
    logs: list[dict[str, str]]
    artifacts: list[Path]
    metrics: dict[str, Any]
    retriable: bool


class CodexRunner:
    """Codex CLI adapter with default mock mode for local bootstrap."""

    def __init__(self) -> None:
        self.mode = os.getenv("OPENFARS_CODEX_MODE", "mock").lower()
        self.command = os.getenv("OPENFARS_CODEX_COMMAND", "codex")

    def run_step(
        self,
        task_spec: dict[str, Any],
        step_key: str,
        workspace_dir: Path,
        attempt: int,
        soft_timeout: int = 120,
        hard_timeout: int = 180,
    ) -> StepExecutionResult:
        if self.mode != "real":
            return self._run_mock(task_spec=task_spec, step_key=step_key, workspace_dir=workspace_dir, attempt=attempt)

        if shutil.which(self.command) is None:
            return self._run_mock(task_spec=task_spec, step_key=step_key, workspace_dir=workspace_dir, attempt=attempt)

        return self._run_real(
            task_spec=task_spec,
            workspace_dir=workspace_dir,
            soft_timeout=soft_timeout,
            hard_timeout=hard_timeout,
        )

    def _run_mock(
        self,
        task_spec: dict[str, Any],
        step_key: str,
        workspace_dir: Path,
        attempt: int,
    ) -> StepExecutionResult:
        time.sleep(0.25)

        logs = [
            {
                "title": "Codex Runner",
                "content": f"Executing {step_key} (attempt {attempt})",
                "status": "running",
                "workedFor": "<1s",
                "source": "codex-cli",
                "level": "info",
                "raw": json.dumps(task_spec, ensure_ascii=True),
            }
        ]

        # Simulate one transient failure to exercise retry path.
        if step_key == "code_and_execute" and attempt == 1:
            logs.append(
                {
                    "title": "Codex Runner",
                    "content": "Transient execution failure detected; eligible for auto-retry.",
                    "status": "error",
                    "workedFor": "<1s",
                    "source": "codex-cli",
                    "level": "warning",
                    "raw": "mock transient failure",
                }
            )
            return StepExecutionResult(
                status="failed",
                summary="Mock transient failure",
                logs=logs,
                artifacts=[],
                metrics={"tokens": 120_000, "cost_usd": 0.84, "token_cost_usd": 0.84, "gpu_hours": 0.02},
                retriable=True,
            )

        artifacts: list[Path] = []
        if step_key == "final_packaging":
            report_path = workspace_dir / "report.json"
            report_path.write_text(
                json.dumps(
                    {
                        "title": task_spec.get("goal"),
                        "summary": "OpenFARS run finished in mock mode.",
                        "status": "success",
                    },
                    indent=2,
                    ensure_ascii=False,
                ),
                encoding="utf-8",
            )
            artifacts.append(report_path)

            tex_path = workspace_dir / "paper_draft.tex"
            tex_path.write_text(
                "\\documentclass{article}\\begin{document}OpenFARS Draft\\end{document}\n",
                encoding="utf-8",
            )
            artifacts.append(tex_path)

        raw_output = """
<openfars_result>
{
  "status": "success",
  "summary": "step completed",
  "artifacts": [],
  "metrics": {"tokens": 180000, "cost_usd": 1.2, "token_cost_usd": 1.2, "gpu_hours": 0.05},
  "next_inputs": {}
}
</openfars_result>
"""

        parsed = parse_openfars_result(raw_output)
        return StepExecutionResult(
            status=parsed.status,
            summary=parsed.summary,
            logs=logs,
            artifacts=artifacts,
            metrics=parsed.metrics,
            retriable=False,
        )

    def _run_real(
        self,
        task_spec: dict[str, Any],
        workspace_dir: Path,
        soft_timeout: int,
        hard_timeout: int,
    ) -> StepExecutionResult:
        task_file = workspace_dir / "task_spec.json"
        task_file.write_text(json.dumps(task_spec, indent=2, ensure_ascii=False), encoding="utf-8")

        start = time.time()
        process = subprocess.Popen(
            [self.command, "run", str(task_file)],
            cwd=workspace_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        try:
            stdout, stderr = process.communicate(timeout=soft_timeout)
        except subprocess.TimeoutExpired:
            process.terminate()
            try:
                stdout, stderr = process.communicate(timeout=max(1, hard_timeout - soft_timeout))
            except subprocess.TimeoutExpired:
                process.kill()
                stdout, stderr = process.communicate()

        elapsed = max(0.1, time.time() - start)
        raw_output = f"{stdout}\n{stderr}".strip()
        logs = [
            {
                "title": "Codex Runner",
                "content": "Codex CLI execution finished",
                "status": "completed" if process.returncode == 0 else "error",
                "workedFor": f"{elapsed:.1f}s",
                "source": "codex-cli",
                "level": "info" if process.returncode == 0 else "error",
                "raw": raw_output[:10_000],
            }
        ]

        if process.returncode != 0:
            return StepExecutionResult(
                status="failed",
                summary="Codex process exited with non-zero code",
                logs=logs,
                artifacts=[],
                metrics={"tokens": 0, "cost_usd": 0, "token_cost_usd": 0, "gpu_hours": 0},
                retriable=True,
            )

        parsed = parse_openfars_result(raw_output)
        artifact_paths: list[Path] = []
        for rel_path in parsed.artifacts:
            candidate = (workspace_dir / rel_path).resolve()
            if candidate.exists():
                artifact_paths.append(candidate)

        return StepExecutionResult(
            status=parsed.status,
            summary=parsed.summary,
            logs=logs,
            artifacts=artifact_paths,
            metrics=parsed.metrics,
            retriable=parsed.status != "success",
        )


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        while True:
            chunk = fh.read(8192)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()
