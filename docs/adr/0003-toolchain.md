# ADR 0003: Toolchain pins

- Node: F0
- Date: 2026-08-22

## Status

Accepted

## Context

The repository was empty. Later nodes need a single, CI-enforced toolchain so clean-clone
verification is possible. Local development currently has Node 20 and Python 3.14;
GitHub Actions should use a conservative, widely available Python.

## Decision

- Node.js 20.x (`package.json` engines `>=20 <21`, `.nvmrc` `20`)
- Python 3.12 or newer (`requires-python = ">=3.12"`, CI and `.python-version` at 3.12)
- pnpm 10.x as the Node package manager (`packageManager` field)
- vitest for TypeScript tests, pytest and ruff for Python
- `bash scripts/verify.sh` as the full verification gate used locally and in CI
- Project-local `.venv` created by the verify script so PEP 668 managed Pythons
  (Homebrew, Debian) do not require `--break-system-packages`

Do not add production runtime dependencies in F0.

## Consequences

- Contributors must use Node 20, not 18 or 22.
- Python 3.12, 3.13, and 3.14 are acceptable locally; CI proves 3.12.
- Lockfiles are required for Node (`pnpm-lock.yaml`). Python deps are pinned by the
  versions declared in `pyproject.toml` optional `dev` extras until a later node adds a
  lockfile if reproducibility requires it.
- Changing a pin is a single-writer CI/root-config change.
