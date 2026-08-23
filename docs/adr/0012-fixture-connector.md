# ADR 0012: Source-neutral fixture connector (no live CourtListener)

- Node: D1
- Date: 2026-08-22

## Status

Accepted

## Context

ADR 0008 blocked networked CourtListener/RECAP access. D1 still needs snapshot and
failure contracts so R1 can proceed against fixtures.

## Decision

- `SourceConnector` is source-neutral. Authorized mode is `fixture` only.
- `FixtureConnector` serves offline synthetic snapshots. `networkEnabled` and
  `liveCourtListener` are false.
- Missing documents are `not_found`. Mixed id lists are `partial_ingestion`, never
  empty success.
- `ImmutableSnapshotStore` rejects content-hash replacement.
- Metadata records license, coverage, rate limit, and redistribution. Fixtures are
  not CourtListener data.

## Consequences

- R1 may resolve citations against fixture snapshots only.
- A live adapter requires written FLP authorization and a new ADR.
