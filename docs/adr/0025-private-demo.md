# ADR 0025: Local private fixture-only demo, not a public host

- Node: D2
- Date: 2026-08-22

## Status

Proposed

## Context

v0.1 needs a production-shaped walkthrough. Z2 still forbids a public URL.

## Decision

Ship `@evidenceops/demo`, bound to `127.0.0.1` only, fixture snapshots only, synthetic
seed data, A1 on every request. One-command start/stop/reset via `scripts/demo.sh`.
Reset requires `confirm=demo-data-only` and cannot delete other tenants.

Screenshots and recordings may be captured locally. Do not upload them as a public demo.

## Consequences

This is not a hosted product. Public ingress, live CourtListener, and privileged data
remain forbidden.
