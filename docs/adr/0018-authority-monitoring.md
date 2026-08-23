# ADR 0018: Authority-version monitoring and redlines

- Node: M1
- Date: 2026-08-22

## Status

Accepted

## Context

Accepted conclusions must not silently change when an authority version changes.
Impact traversal already exists on G2.

## Decision

- Classify text diffs as `none`, `meaningful`, or `supersession`.
- Walk G2 `changeImpact` for direct then transitive proposition and memo hits.
- Emit a redline artifact for reviewer display.
- Changing an accepted conclusion requires a recorded human `publish` approval.

## Consequences

- U1 displays redlines. V1 remains the verdict writer. No automatic memo rewrite.
