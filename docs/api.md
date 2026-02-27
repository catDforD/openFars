# OpenFARS API

## REST
- `POST /api/projects` -> create project
- `GET /api/projects` -> list projects
- `POST /api/projects/{id}/runs` -> create run and optionally autostart
- `GET /api/projects/{id}/runs/latest` -> latest run for project
- `GET /api/runs/{id}` -> run detail
- `GET /api/runs/{id}/steps` -> step list
- `GET /api/runs/{id}/jobs` -> job logs
- `GET /api/runs/{id}/artifacts` -> artifact list
- `GET /api/runs/{id}/stats` -> aggregated stats
- `POST /api/runs/{id}/control` -> `{ action: pause|resume|cancel|retry }`

## WebSocket
- `GET /ws/runs/{run_id}`
- Event stream payload shape:

```json
{
  "event": "step_updated",
  "payload": {"step": {}},
  "timestamp": "2026-02-27T00:00:00+00:00"
}
```

- Emitted events:
  - `snapshot`
  - `run_started`
  - `step_updated`
  - `job_log_appended`
  - `artifact_created`
  - `stats_updated`
  - `run_completed`
  - `run_failed`
