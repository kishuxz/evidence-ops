# ADR 0027: Robustness evaluations must not overstate 200/200

- Node: Q2
- Date: 2026-08-22

## Status

Accepted

## Context

Q1 EvidenceOps scored 200/200 on constructed fixtures. That number is easy to misread as
legal reliability or hallucination elimination.

## Decision

Add an offline robustness suite that mutates propositions, authorities, snapshots, tenants,
and citations. Report accuracy, per-class P/R/F1, unresolved rate, isolation failures, and
latency. UNRESOLVED is never counted correct. I1 remains `n/a`.

Do not cite 200/200 constructed-fixture accuracy as production accuracy, legal reliability,
or hallucination-free behavior.

## Consequences

Q2 reports are generated from current code. Claims tests forbid overstatement.
