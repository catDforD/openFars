#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
OPENFARS_CODEX_MODE="${OPENFARS_CODEX_MODE:-mock}"
API_BASE_URL="${VITE_API_BASE_URL:-http://127.0.0.1:${BACKEND_PORT}}"

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  trap - EXIT INT TERM

  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi

  if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi

  wait "$BACKEND_PID" 2>/dev/null || true
  wait "$FRONTEND_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

if ! command -v python >/dev/null 2>&1; then
  echo "[openfars] python not found" >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "[openfars] npm not found" >&2
  exit 1
fi

if [[ ! -d "$ROOT_DIR/ui/app/node_modules" ]]; then
  echo "[openfars] Installing frontend dependencies..."
  (cd "$ROOT_DIR/ui/app" && npm install)
fi

echo "[openfars] Starting backend on http://127.0.0.1:${BACKEND_PORT}"
(
  cd "$ROOT_DIR"
  OPENFARS_CODEX_MODE="$OPENFARS_CODEX_MODE" python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port "$BACKEND_PORT"
) &
BACKEND_PID=$!

echo "[openfars] Starting frontend on http://127.0.0.1:${FRONTEND_PORT}"
(
  cd "$ROOT_DIR/ui/app"
  VITE_API_BASE_URL="$API_BASE_URL" npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT"
) &
FRONTEND_PID=$!

echo "[openfars] Ready"
echo "[openfars] Frontend: http://127.0.0.1:${FRONTEND_PORT}"
echo "[openfars] Backend:  http://127.0.0.1:${BACKEND_PORT}"
echo "[openfars] Press Ctrl+C to stop both processes"

wait -n "$BACKEND_PID" "$FRONTEND_PID"
