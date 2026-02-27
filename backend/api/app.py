from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import api_router
from backend.event_bus import EventBus
from backend.orchestrator.engine import RunOrchestrator
from backend.storage import Database


def _project_root() -> Path:
    return Path(__file__).resolve().parents[2]


@asynccontextmanager
async def lifespan(app: FastAPI):
    root = _project_root()
    db_path = Path(os.getenv("OPENFARS_DB_PATH", str(root / "backend" / "openfars.db")))
    workspace_root = Path(os.getenv("OPENFARS_WORKSPACE_ROOT", str(root / "workspace")))
    workspace_root.mkdir(parents=True, exist_ok=True)
    db_path.parent.mkdir(parents=True, exist_ok=True)

    db = Database(db_path)
    db.initialize()
    bus = EventBus()
    orchestrator = RunOrchestrator(db=db, event_bus=bus, workspace_root=workspace_root)

    app.state.db = db
    app.state.event_bus = bus
    app.state.orchestrator = orchestrator

    yield


def create_app() -> FastAPI:
    app = FastAPI(title="OpenFARS API", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_router)

    @app.get("/healthz")
    async def healthz():
        return {"status": "ok"}

    @app.websocket("/ws/runs/{run_id}")
    async def run_stream(websocket: WebSocket, run_id: str):
        await websocket.accept()
        await app.state.event_bus.subscribe(run_id, websocket)

        # Push initial snapshot so frontend can render immediately.
        run = app.state.db.get_run(run_id)
        if run:
            await websocket.send_json(
                {
                    "event": "snapshot",
                    "payload": {
                        "run": run,
                        "steps": app.state.db.list_steps(run_id),
                        "jobs": app.state.db.list_jobs(run_id),
                        "artifacts": app.state.db.list_artifacts(run_id),
                        "stats": app.state.orchestrator.get_stats_view(run_id),
                    },
                }
            )

        try:
            while True:
                # Keep connection alive and allow optional ping/pong.
                await websocket.receive_text()
        except WebSocketDisconnect:
            await app.state.event_bus.unsubscribe(run_id, websocket)

    return app
