# OpenFARS Runbook

## Start Backend
```bash
python -m uvicorn backend.main:app --reload --port 8000
```

## Start Frontend
```bash
cd ui/app
npm install
npm run dev
```

## One-Click Start
```bash
./dev.sh
```

The script starts backend and frontend together and stops both on `Ctrl+C`.

## Environment Variables
- `OPENFARS_DB_PATH`: SQLite file path (default `backend/openfars.db`)
- `OPENFARS_WORKSPACE_ROOT`: workspace root (default `workspace/`)
- `OPENFARS_CODEX_MODE`: `mock` (default) or `real`
- `OPENFARS_CODEX_COMMAND`: codex executable name/path (default `codex`)
- `VITE_API_BASE_URL`: frontend REST base (default `http://localhost:8000`)
- `VITE_WS_BASE_URL`: frontend WS base (optional, auto-derived from API base)

## Notes
- Default mode is `mock` to make local bootstrap deterministic.
- For real Codex CLI mode, ensure command emits `<openfars_result>` block.
- Artifacts are written to `workspace/{project_id}/{run_id}/{step_key}`.
