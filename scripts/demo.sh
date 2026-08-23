#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
PID_FILE="${EVIDENCEOPS_DEMO_PID:-$ROOT/.evidenceops-demo.pid}"
PORT="${EVIDENCEOPS_DEMO_PORT:-8787}"
HOST="127.0.0.1"
DATA_DIR="${EVIDENCEOPS_DEMO_DATA:-$ROOT/.evidenceops-demo}"

cmd="${1:-help}"

case "$cmd" in
  start)
    mkdir -p "$DATA_DIR"
    pnpm --filter @evidenceops/demo build
    EVIDENCEOPS_DEMO_DATA="$DATA_DIR" EVIDENCEOPS_DEMO_PORT="$PORT" \
      node packages/demo/dist/server.js >/tmp/evidenceops-demo.log 2>&1 &
    echo $! > "$PID_FILE"
    for _ in 1 2 3 4 5 6 7 8 9 10; do
      if curl -fsS "http://${HOST}:${PORT}/health" >/dev/null 2>&1; then
        echo "demo listening on http://${HOST}:${PORT} (private bind, not public)"
        exit 0
      fi
      sleep 0.2
    done
    echo "demo failed to become healthy" >&2
    exit 1
    ;;
  stop)
    if [[ -f "$PID_FILE" ]]; then
      kill "$(cat "$PID_FILE")" 2>/dev/null || true
      rm -f "$PID_FILE"
    fi
    echo "demo stopped"
    ;;
  reset)
    curl -fsS -X POST "http://${HOST}:${PORT}/v1/reset?confirm=demo-data-only" \
      -H "authorization: Bearer demo-admin-local-only"
    echo
    ;;
  script)
    EVIDENCEOPS_DEMO_URL="http://${HOST}:${PORT}" pnpm --filter @evidenceops/demo script
    ;;
  help|*)
    echo "usage: bash scripts/demo.sh start|stop|reset|script"
    echo "binds ${HOST} only; fixture snapshots; not a public host"
    ;;
esac
