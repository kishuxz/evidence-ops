# ADR 0001: Record architecture decisions in `docs/adr`

- Node: F0
- Date: 2026-08-22

## Status

Accepted

## Context

EvidenceOps Legal will have many single-writer contract changes (schemas, IDs, verdicts,
graph semantics, APIs, auth, CI, releases). Chat history and PR descriptions are not a
durable record. `docs/AUTONOMOUS_EXECUTION.md` requires an inspectable decision trail.

## Decision

Store architecture decision records in `docs/adr/` using `0000-template.md`. Every
foundation and later shared-contract choice that later nodes must obey gets an ADR.
Superseding a decision requires a new ADR; do not silently edit an accepted decision's
substance without changing status.

## Consequences

- Later agents can reconstruct why toolchain, layout, and contract choices exist.
- ADRs are shared-contract files: one primary writer at a time.
- Process overhead is accepted in exchange for merge-time reviewability.
