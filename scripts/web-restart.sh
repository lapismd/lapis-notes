#!/usr/bin/env bash
# Free the web Vite port, then start the existing root dev:web lane.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# Keep aligned with packages/web/vite.config.ts server/preview.port.
PORT=4174

listener_pids() {
  lsof -nP -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true
}

if ! command -v lsof >/dev/null 2>&1; then
  echo "restart:web requires lsof to inspect port $PORT" >&2
  exit 1
fi

pids="$(listener_pids)"
if [[ -n "$pids" ]]; then
  echo "stopping listeners on port $PORT"
  # shellcheck disable=SC2086
  kill $pids 2>/dev/null || true
  for _ in 1 2 3 4 5 6 7; do
    [[ -z "$(listener_pids)" ]] && break
    sleep 0.1
  done
  remaining="$(listener_pids)"
  if [[ -n "$remaining" ]]; then
    # shellcheck disable=SC2086
    kill -9 $remaining 2>/dev/null || true
  fi
else
  echo "no listener on port $PORT"
fi

echo "starting web on http://localhost:$PORT"
cd "$ROOT"
exec pnpm dev:web
