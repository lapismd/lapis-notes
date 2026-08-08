#!/usr/bin/env bash
# Stop the Storybook supervisor and descendants for this checkout and port lane.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec node "$ROOT/scripts/storybook-process.mjs" stop

