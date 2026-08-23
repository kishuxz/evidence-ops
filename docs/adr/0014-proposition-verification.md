# ADR 0014: Deterministic proposition verification

- Node: V1
- Date: 2026-08-22

## Status

Proposed

## Context

Verdicts are a shared contract (S1). Retrieval (X1) and the graph (G2/G3) must not
invent support. Unknown, missing, or conflicting evidence must not become a memo
admissible success.

## Decision

- `@evidenceops/verify` is the sole writer of verdict *behavior*. The catalog
  remains the sole writer of the verdict vocabulary.
- `verifyProposition` is deterministic, fail-closed, and uses catalog reason codes.
- Evaluation is offline: snapshot text plus resolved identity flags. No live
  CourtListener and no external model in the core engine.
- Precedence: unresolved identity → wrong document → wrong jurisdiction → stale
  authority → explicit contradiction → quotation/pinpoint → full/partial/no
  support → `UNRESOLVED`.
- `UNRESOLVED` is never treated as support or as a correct evaluation hit.

## Consequences

- Other lanes pass identity and passage evidence into V1. They do not remap
  verdicts.
- Corpus expansion tests V1; it does not change V1 semantics.
