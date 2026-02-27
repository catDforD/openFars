# OpenFARS Architecture

## Runtime Layout
- `backend/api`: FastAPI app, REST and websocket routes.
- `backend/orchestrator`: 8-step workflow execution state machine.
- `backend/codex_runner`: Codex CLI adapter and `<openfars_result>` parser.
- `backend/policy_engine`: command/path safety rules.
- `backend/knowledge`: placeholder service for future retrieval integration.
- `workspace/{project_id}/{run_id}/{step_key}`: step workdirs, task specs, checkpoints, artifacts.

## Core Data Flow
1. `POST /api/projects/{id}/runs` creates a run and persists 8 pending steps.
2. Orchestrator starts asynchronously and publishes lifecycle events through websocket.
3. Each step writes `task_spec.json`, executes codex runner, writes `step_state.json`.
4. Structured output is parsed from `<openfars_result>...</openfars_result>`.
5. Jobs/stats/artifacts are persisted to SQLite and pushed to UI via websocket.

## Reliability
- Auto-retry for retriable step failures (default max 2).
- Pause/resume/cancel/retry controls via `POST /api/runs/{id}/control`.
- Step-level checkpoint persisted in workspace for resume diagnostics.
