# ADR 0015: Offline hybrid retrieval

- Node: X1
- Date: 2026-08-22

## Status

Proposed

## Context

R1 resolves citations against fixture snapshots. Search must not call CourtListener,
hosted embedding APIs, or any network. Near-duplicate captions are a known
wrong-document failure mode.

## Decision

- `@evidenceops/retrieve` indexes local documents only.
- Ranking is hybrid: lexical token overlap plus a deterministic hashed-trigram
  vector. No external model is loaded or called.
- Jurisdiction, `asOf` date, and authority `versionLocator` filter candidates
  before scoring.
- Equal hybrid scores break ties by document id ascending.
- Hits carry snippet evidence and a `wrongDocumentRisk` flag when a cited id is
  known and a different near-scoring document remains in the result.
- Diagnostics record that `network` and `liveCourtListener` are false.

## Consequences

- V1 consumes retrieved vs cited document ids; X1 does not assign verdicts.
- Expanding coverage is D1/R1 fixture work, not a silent network lookup.
