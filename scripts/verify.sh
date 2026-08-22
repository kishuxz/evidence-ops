#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v node >/dev/null 2>&1; then
  echo "verify: node is required" >&2
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [[ "${NODE_MAJOR}" -lt 20 || "${NODE_MAJOR}" -ge 21 ]]; then
  echo "verify: Node 20.x required, found $(node -v)" >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "verify: python3 is required" >&2
  exit 1
fi

python3 - <<'PY'
import sys

if sys.version_info < (3, 12):
    raise SystemExit(f"verify: Python >=3.12 required, found {sys.version}")
print(f"verify: python {sys.version.split()[0]}")
PY

if ! command -v pnpm >/dev/null 2>&1; then
  echo "verify: pnpm is required" >&2
  exit 1
fi

if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate

if [[ "${SKIP_INSTALL:-}" != "1" ]]; then
  if [[ "${CI:-}" == "true" ]]; then
    pnpm install --frozen-lockfile
  else
    pnpm install
  fi
  python -m pip install --upgrade pip
  python -m pip install -e ".[dev]"
fi

pnpm typecheck
pnpm test
python -m pytest
python -m ruff check src tests

echo "verify: ok"
