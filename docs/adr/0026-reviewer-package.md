# ADR 0026: Expert-reviewer package does not complete expert review

- Node: E2
- Date: 2026-08-22

## Status

Accepted

## Context

The 200-case corpus is synthetic engineering fixtures. PRODUCT_SPEC wants expert-reviewable
cases; it does not authorize this repository to perform or claim that review.

## Decision

Ship a reviewer package (instructions, rubric, conflict policy, blinded labels, agreement
math, signed manifest, import validation) derived from the current corpus hashes.

Importing completed reviews **must not** flip `origin`, `sourceKind`, `reviewStatus`, or
`independentReview`. Those fields stay
`synthetic` / `constructed` / `engineering_fixture_awaiting_expert_review` / `false`
until qualified external reviewers complete the process in a later, explicit node.

## Consequences

Disagreements are recorded. Labels are not silently changed to improve evaluation scores.
