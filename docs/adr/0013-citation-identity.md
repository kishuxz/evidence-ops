# ADR 0013: Fixture-backed citation identity

- Node: R1
- Date: 2026-08-22

## Status

Accepted

## Context

Authority IDs must be deterministic (S1) and must not call CourtListener (ADR 0008).
D1 provides fixture snapshots only.

## Decision

- Normalize reporter citations to `"{volume} {reporter} {page}"` with lowercase
  reporter and stripped periods.
- Resolve `citationKey` through an explicit fixture index onto `FixtureConnector`.
- Unknown keys and mismatched version locators are `not_found`, never success.
- Authority IDs use S1 `stableId("Authority", { jurisdictionCode, citationKey })`.

## Consequences

- X1/V1 consume this resolver. Expanding the index is R1/D1 work, not silent
  network lookup.
