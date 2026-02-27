from __future__ import annotations

import os

import pytest

from backend.event_bus import EventBus
from backend.orchestrator.engine import RunOrchestrator
from backend.storage import Database


@pytest.mark.asyncio
async def test_api_end_to_end_flow(tmp_path) -> None:
    os.environ["OPENFARS_CODEX_MODE"] = "mock"

    db = Database(tmp_path / "openfars_test.db")
    db.initialize()
    orchestrator = RunOrchestrator(db=db, event_bus=EventBus(), workspace_root=tmp_path / "workspace")

    project = db.create_project("Demo Project")
    run = orchestrator.create_run(project["id"])
    await orchestrator._execute_run(run["id"])  # noqa: SLF001

    current = db.get_run(run["id"])
    assert current is not None
    assert current["status"] == "completed"

    steps = db.list_steps(run["id"])
    assert len(steps) == 8
    assert all(step["status"] == "completed" for step in steps)

    artifacts = db.list_artifacts(run["id"])
    artifact_paths = [item["path"] for item in artifacts]
    assert any(path.endswith("report.json") for path in artifact_paths)
    assert any(path.endswith("paper_draft.tex") for path in artifact_paths)

    jobs = db.list_jobs(run["id"])
    assert len(jobs) >= 8
