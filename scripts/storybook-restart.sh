#!/usr/bin/env bash
# Kill Storybook listeners for this package and start a fresh dev server.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${STORYBOOK_PORT:-7010}"

bash "$ROOT/scripts/storybook-stop.sh"

echo "starting Storybook on http://localhost:$PORT"
exec env STORYBOOK_REPLACE=1 WATCHPACK_POLLING=250 STORYBOOK_PORT="$PORT" node "$ROOT/scripts/storybook-run.mjs" --no-open
