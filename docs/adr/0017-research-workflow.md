# ADR 0017: Durable offline research workflow

- Node: W1
- Date: 2026-08-22

## Status

Proposed

## Context

X1 and V1 exist. Research must be idempotent, checkpointed, and fail closed when
a step does not finish. Publish and other external actions require A1 human
approval. Evaluation stays offline.

## Decision

- `@evidenceops/workflow` runs retrieve → resolve → verify in deterministic
  offline mode.
- Runs are keyed by `idempotencyKey`. Completed runs replay as identity.
- Each step writes a typed checkpoint. Partial completion is `failed` or
  `dead_letter`, never `completed`.
- Bounded retries, timeouts, and token/cost budgets fail the run when exceeded.
- `publish` is `awaiting_approval` until `ApprovalPolicy` records a human
  approval.
- Workflow does not change V1 verdict semantics.

## Consequences

- M1/P1/U1 consume checkpoints and run records. They must not invent a success
  from a dead letter.
