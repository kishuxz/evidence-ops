# ADR 0023: Stop before Z2 after independent Z1 reviews

- Node: Z1
- Date: 2026-08-22

## Status

Accepted

## Context

Required implementation nodes through Q1 are merged. Z2 still needs separate
human authorization. I1 and live CourtListener remain blocked.

## Decision

- Record independent Z1 reviews in `docs/Z1_REVIEW.md`.
- Repair confirmed documentation and fail-closed tests in the same change.
- Publish `docs/RELEASE_CANDIDATE.md` and **stop**. Do not publish packages or
  host a public demo.

## Consequences

- Progress may show Z1 merged and Z2 blocked with no `in_progress` node.
- Future public launch is a new human decision, not a continuation of this PR.
