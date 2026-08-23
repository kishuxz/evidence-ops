# ADR 0021: Telemetry baseline without invented SLOs

- Node: O1
- Date: 2026-08-22

## Status

Proposed

## Context

Operators need traces, correlation ids, structured logs, and failure alerts.
Inventing SLOs before measuring would be a false claim.

## Decision

- `@evidenceops/obs` records spans, correlation ids, structured logs, workflow
  latency/cost, connector/retrieval failures, dead letters, and retries.
- Runbooks live in `docs/runbooks/`.
- `docs/O1_BASELINE.md` states that no availability or latency SLO is defined
  until measurements exist.

## Consequences

- Q1 bench numbers are the first measured latency/cost baseline.
- Alerts are log events, not paging SLOs.
