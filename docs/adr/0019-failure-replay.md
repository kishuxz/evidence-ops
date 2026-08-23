# ADR 0019: Failure attribution and research replay

- Node: P1
- Date: 2026-08-22

## Status

Proposed

## Context

W1 records checkpoints. Confirmed failures must become regression fixtures rather
than disappearing into a successful retry.

## Decision

- Attribute failure to the earliest invalid retrieve/resolve/verify/approval step.
- Restore the last valid checkpoint and rerun the remaining branch.
- Compare original and replay status/verdict.
- Convert the failed run into an eval regression fixture with provenance in the
  annotation rationale.

## Consequences

- Replay must not mark UNRESOLVED or dead letters as correct.
- Corpus expansion (Q1) may ingest these fixtures; it must keep their labels honest.
