# ADR 0020: Reviewer evidence view

- Node: U1
- Date: 2026-08-22

## Status

Accepted

## Context

Reviewers need proposition/passage evidence, verdicts, conflicts, version history,
and redlines. Accept/reject/request-research must be append-only.

## Decision

- `@evidenceops/reviewer` renders a side-by-side evidence view as HTML.
- Actions `accept`, `reject`, and `request_research` append to A1 `AuditLog`.
- The audit log remains append-only; delete is forbidden.

## Consequences

- This is a review support UI, not a lawyer or citator. No public hosted demo.
