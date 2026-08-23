# ADR 0024: Packaged local CLI, not a published package

- Node: C1
- Date: 2026-08-22

## Status

Accepted

## Context

Z1 documented that README command verbs were not a shipped binary. v0.1 still needs a
real `evidenceops` executable for demos and automation. Publishing to npm/PyPI remains a
Z2 human authorization.

## Decision

Ship `@evidenceops/cli` as a **locally packable** Node executable (`evidenceops`).

- Install path: `pnpm pack` in `packages/cli`, then install the tarball in a consumer
  directory. That is packaging, not publication.
- The package is `private: true`. Do not `npm publish` / `pnpm publish`.
- Documentation must call this a packaged implementation, never a registry release.
- Runtime stays fixture-only and offline (ADR 0008).

## Consequences

Pack-install-run is an acceptance test. A GitHub Release, version tag, or registry
publish still requires Z2 authorization.
