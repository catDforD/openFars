from __future__ import annotations

import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class Database:
    """Simple SQLite persistence layer for projects, runs, steps, jobs and artifacts."""

    def __init__(self, db_path: Path) -> None:
        self._db_path = db_path
        self._lock = threading.RLock()
        self._conn = sqlite3.connect(db_path, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row

    def initialize(self) -> None:
        with self._lock, self._conn:
            self._conn.executescript(
                """
                PRAGMA journal_mode=WAL;

                CREATE TABLE IF NOT EXISTS projects (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    status TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS runs (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    status TEXT NOT NULL,
                    current_step_index INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    started_at TEXT,
                    ended_at TEXT,
                    FOREIGN KEY(project_id) REFERENCES projects(id)
                );

                CREATE TABLE IF NOT EXISTS steps (
                    id TEXT PRIMARY KEY,
                    run_id TEXT NOT NULL,
                    step_key TEXT NOT NULL,
                    number INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    status TEXT NOT NULL,
                    started_at TEXT,
                    ended_at TEXT,
                    error_message TEXT,
                    updated_at TEXT NOT NULL,
                    UNIQUE(run_id, step_key),
                    FOREIGN KEY(run_id) REFERENCES runs(id)
                );

                CREATE TABLE IF NOT EXISTS jobs (
                    id TEXT PRIMARY KEY,
                    run_id TEXT NOT NULL,
                    step_id TEXT,
                    time TEXT NOT NULL,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    status TEXT NOT NULL,
                    worked_for TEXT NOT NULL,
                    source TEXT NOT NULL,
                    level TEXT NOT NULL,
                    raw TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(run_id) REFERENCES runs(id)
                );

                CREATE TABLE IF NOT EXISTS artifacts (
                    id TEXT PRIMARY KEY,
                    run_id TEXT NOT NULL,
                    step_id TEXT,
                    path TEXT NOT NULL,
                    size INTEGER NOT NULL,
                    sha256 TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(run_id) REFERENCES runs(id)
                );

                CREATE TABLE IF NOT EXISTS stats (
                    run_id TEXT PRIMARY KEY,
                    hypothesis INTEGER NOT NULL DEFAULT 0,
                    papers INTEGER NOT NULL DEFAULT 0,
                    tokens INTEGER NOT NULL DEFAULT 0,
                    cost_usd REAL NOT NULL DEFAULT 0,
                    elapsed_seconds INTEGER NOT NULL DEFAULT 0,
                    token_cost_usd REAL NOT NULL DEFAULT 0,
                    gpu_hours REAL NOT NULL DEFAULT 0,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY(run_id) REFERENCES runs(id)
                );
                """
            )

    def create_project(self, name: str) -> dict[str, Any]:
        project_id = f"FA{uuid.uuid4().int % 1_000_000:06d}"
        ts = now_iso()
        with self._lock, self._conn:
            self._conn.execute(
                "INSERT INTO projects (id, name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                (project_id, name, "in_progress", ts, ts),
            )
        return self.get_project(project_id)

    def list_projects(self) -> list[dict[str, Any]]:
        with self._lock:
            rows = self._conn.execute(
                "SELECT id, name, status, created_at, updated_at FROM projects ORDER BY updated_at DESC"
            ).fetchall()
        return [self._row_to_project(r) for r in rows]

    def get_project(self, project_id: str) -> dict[str, Any] | None:
        with self._lock:
            row = self._conn.execute(
                "SELECT id, name, status, created_at, updated_at FROM projects WHERE id = ?", (project_id,)
            ).fetchone()
        return self._row_to_project(row) if row else None

    def update_project_status(self, project_id: str, status: str) -> None:
        with self._lock, self._conn:
            self._conn.execute(
                "UPDATE projects SET status = ?, updated_at = ? WHERE id = ?",
                (status, now_iso(), project_id),
            )

    def create_run(self, project_id: str, steps: list[dict[str, Any]]) -> dict[str, Any]:
        run_id = f"run_{uuid.uuid4().hex[:10]}"
        ts = now_iso()
        with self._lock, self._conn:
            self._conn.execute(
                """
                INSERT INTO runs (id, project_id, status, current_step_index, created_at, updated_at, started_at, ended_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (run_id, project_id, "pending", 0, ts, ts, None, None),
            )
            for step in steps:
                step_id = f"step_{uuid.uuid4().hex[:12]}"
                self._conn.execute(
                    """
                    INSERT INTO steps (id, run_id, step_key, number, title, status, started_at, ended_at, error_message, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (step_id, run_id, step["key"], step["number"], step["title"], "pending", None, None, None, ts),
                )
            self._conn.execute(
                "INSERT INTO stats (run_id, updated_at) VALUES (?, ?)",
                (run_id, ts),
            )
            self._conn.execute(
                "UPDATE projects SET status = ?, updated_at = ? WHERE id = ?",
                ("in_progress", ts, project_id),
            )
        return self.get_run(run_id)

    def get_run(self, run_id: str) -> dict[str, Any] | None:
        with self._lock:
            row = self._conn.execute(
                """
                SELECT id, project_id, status, current_step_index, created_at, updated_at, started_at, ended_at
                FROM runs WHERE id = ?
                """,
                (run_id,),
            ).fetchone()
        return self._row_to_run(row) if row else None

    def list_project_runs(self, project_id: str) -> list[dict[str, Any]]:
        with self._lock:
            rows = self._conn.execute(
                """
                SELECT id, project_id, status, current_step_index, created_at, updated_at, started_at, ended_at
                FROM runs
                WHERE project_id = ?
                ORDER BY created_at DESC
                """,
                (project_id,),
            ).fetchall()
        return [self._row_to_run(r) for r in rows]

    def get_latest_run_for_project(self, project_id: str) -> dict[str, Any] | None:
        runs = self.list_project_runs(project_id)
        return runs[0] if runs else None

    def update_run(self, run_id: str, **fields: Any) -> None:
        if not fields:
            return
        fields["updated_at"] = now_iso()
        keys = ", ".join(f"{key} = ?" for key in fields)
        values = list(fields.values()) + [run_id]
        with self._lock, self._conn:
            self._conn.execute(f"UPDATE runs SET {keys} WHERE id = ?", values)

    def list_steps(self, run_id: str) -> list[dict[str, Any]]:
        with self._lock:
            rows = self._conn.execute(
                """
                SELECT id, run_id, step_key, number, title, status, started_at, ended_at, error_message
                FROM steps WHERE run_id = ? ORDER BY number ASC
                """,
                (run_id,),
            ).fetchall()
        return [self._row_to_step(r) for r in rows]

    def get_step_by_key(self, run_id: str, step_key: str) -> dict[str, Any] | None:
        with self._lock:
            row = self._conn.execute(
                """
                SELECT id, run_id, step_key, number, title, status, started_at, ended_at, error_message
                FROM steps WHERE run_id = ? AND step_key = ?
                """,
                (run_id, step_key),
            ).fetchone()
        return self._row_to_step(row) if row else None

    def update_step(self, step_id: str, **fields: Any) -> None:
        if not fields:
            return
        fields["updated_at"] = now_iso()
        keys = ", ".join(f"{key} = ?" for key in fields)
        values = list(fields.values()) + [step_id]
        with self._lock, self._conn:
            self._conn.execute(f"UPDATE steps SET {keys} WHERE id = ?", values)

    def reset_failed_steps_for_retry(self, run_id: str) -> None:
        ts = now_iso()
        with self._lock, self._conn:
            self._conn.execute(
                """
                UPDATE steps
                SET status = 'pending', error_message = NULL, started_at = NULL, ended_at = NULL, updated_at = ?
                WHERE run_id = ? AND status = 'error'
                """,
                (ts, run_id),
            )
            self._conn.execute(
                "UPDATE runs SET status = 'pending', ended_at = NULL, updated_at = ? WHERE id = ?",
                (ts, run_id),
            )

    def add_job(
        self,
        run_id: str,
        step_id: str | None,
        title: str,
        content: str,
        status: str,
        worked_for: str,
        source: str,
        level: str,
        raw: str,
    ) -> dict[str, Any]:
        job_id = f"job_{uuid.uuid4().hex[:12]}"
        ts = now_iso()
        wall_time = datetime.now().strftime("%H:%M")
        with self._lock, self._conn:
            self._conn.execute(
                """
                INSERT INTO jobs (id, run_id, step_id, time, title, content, status, worked_for, source, level, raw, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (job_id, run_id, step_id, wall_time, title, content, status, worked_for, source, level, raw, ts),
            )
        return self.get_job(job_id)

    def get_job(self, job_id: str) -> dict[str, Any] | None:
        with self._lock:
            row = self._conn.execute(
                """
                SELECT id, run_id, step_id, time, title, content, status, worked_for, source, level, raw, created_at
                FROM jobs WHERE id = ?
                """,
                (job_id,),
            ).fetchone()
        return self._row_to_job(row) if row else None

    def list_jobs(self, run_id: str, limit: int = 200) -> list[dict[str, Any]]:
        with self._lock:
            rows = self._conn.execute(
                """
                SELECT id, run_id, step_id, time, title, content, status, worked_for, source, level, raw, created_at
                FROM jobs WHERE run_id = ? ORDER BY created_at DESC LIMIT ?
                """,
                (run_id, limit),
            ).fetchall()
        return [self._row_to_job(r) for r in rows]

    def add_artifact(self, run_id: str, step_id: str | None, path: str, size: int, sha256: str) -> dict[str, Any]:
        artifact_id = f"artifact_{uuid.uuid4().hex[:12]}"
        ts = now_iso()
        with self._lock, self._conn:
            self._conn.execute(
                """
                INSERT INTO artifacts (id, run_id, step_id, path, size, sha256, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (artifact_id, run_id, step_id, path, size, sha256, ts),
            )
        return self.get_artifact(artifact_id)

    def get_artifact(self, artifact_id: str) -> dict[str, Any] | None:
        with self._lock:
            row = self._conn.execute(
                """
                SELECT id, run_id, step_id, path, size, sha256, created_at
                FROM artifacts WHERE id = ?
                """,
                (artifact_id,),
            ).fetchone()
        return self._row_to_artifact(row) if row else None

    def list_artifacts(self, run_id: str) -> list[dict[str, Any]]:
        with self._lock:
            rows = self._conn.execute(
                """
                SELECT id, run_id, step_id, path, size, sha256, created_at
                FROM artifacts WHERE run_id = ? ORDER BY created_at DESC
                """,
                (run_id,),
            ).fetchall()
        return [self._row_to_artifact(r) for r in rows]

    def get_stats(self, run_id: str) -> dict[str, Any] | None:
        with self._lock:
            row = self._conn.execute(
                """
                SELECT run_id, hypothesis, papers, tokens, cost_usd, elapsed_seconds, token_cost_usd, gpu_hours, updated_at
                FROM stats WHERE run_id = ?
                """,
                (run_id,),
            ).fetchone()
        return self._row_to_stats(row) if row else None

    def update_stats(self, run_id: str, **fields: Any) -> dict[str, Any] | None:
        if not fields:
            return self.get_stats(run_id)
        fields["updated_at"] = now_iso()
        keys = ", ".join(f"{key} = ?" for key in fields)
        values = list(fields.values()) + [run_id]
        with self._lock, self._conn:
            self._conn.execute(f"UPDATE stats SET {keys} WHERE run_id = ?", values)
        return self.get_stats(run_id)

    @staticmethod
    def _row_to_project(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "id": row["id"],
            "name": row["name"],
            "status": row["status"],
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"],
        }

    @staticmethod
    def _row_to_run(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "id": row["id"],
            "projectId": row["project_id"],
            "status": row["status"],
            "currentStepIndex": row["current_step_index"],
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"],
            "startedAt": row["started_at"],
            "endedAt": row["ended_at"],
        }

    @staticmethod
    def _row_to_step(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "id": row["id"],
            "runId": row["run_id"],
            "stepKey": row["step_key"],
            "number": row["number"],
            "title": row["title"],
            "status": row["status"],
            "startedAt": row["started_at"],
            "endedAt": row["ended_at"],
            "errorMessage": row["error_message"],
        }

    @staticmethod
    def _row_to_job(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "id": row["id"],
            "runId": row["run_id"],
            "stepId": row["step_id"],
            "time": row["time"],
            "title": row["title"],
            "content": row["content"],
            "status": row["status"],
            "workedFor": row["worked_for"],
            "source": row["source"],
            "level": row["level"],
            "raw": row["raw"],
            "createdAt": row["created_at"],
        }

    @staticmethod
    def _row_to_artifact(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "id": row["id"],
            "runId": row["run_id"],
            "stepId": row["step_id"],
            "path": row["path"],
            "size": row["size"],
            "sha256": row["sha256"],
            "createdAt": row["created_at"],
        }

    @staticmethod
    def _row_to_stats(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "runId": row["run_id"],
            "hypothesis": row["hypothesis"],
            "papers": row["papers"],
            "tokens": row["tokens"],
            "costUsd": row["cost_usd"],
            "elapsedSeconds": row["elapsed_seconds"],
            "tokenCostUsd": row["token_cost_usd"],
            "gpuHours": row["gpu_hours"],
            "updatedAt": row["updated_at"],
        }
