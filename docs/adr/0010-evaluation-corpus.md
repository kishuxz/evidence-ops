# ADR 0010: Initial evaluation corpus is synthetic and incomplete

- Node: E1
- Date: 2026-08-22

## Status

Accepted

## Context

The v0.1 plan targets 200 expert-reviewable cases. E1 must land schema and tooling
without inventing expert review or CourtListener coverage.

## Decision

- Cases are original synthetic texts with `notLiveCourtListener: true`.
- Privileged fixtures are rejected.
- Annotation provenance (rationale, reviewer id/version, timestamp) is required.
- The manifest records target counts vs actual counts. Actual < target is expected
  until later expansion toward Q1.

## Consequences

- Q1 must not report this slice as the full v0.1 corpus.
- E1 does not edit graph store contracts.
