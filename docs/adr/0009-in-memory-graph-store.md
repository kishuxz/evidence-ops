# ADR 0009: In-memory graph store, canonical JSON/JSONL, adapter contract

- Node: G2
- Date: 2026-08-22

## Status

Accepted

## Context

G1 defined the graph document and invariants. Required traversals and an adapter
conformance suite must exist before Neo4j. Evaluation must keep working offline.

## Decision

- `InMemoryGraphStore` is the default `GraphStore`. Graphs are partitioned by
  tenantId+matterId. Import runs `validateGraph` and rejects isolation mismatches.
- Snapshots (`Passage`, `AuthorityVersion`, `Opinion`) are immutable once hashed.
  Accepted `ReviewerDecision` records are append-only.
- Canonical JSON and JSONL are the interchange forms. Import validates.
- Exports redact confidential/privileged attributes by default.
- Traversals (evidence, contradiction, impact, reviewer, replay) are deterministic
  (lexicographic ids; impact lists direct before transitive).
- `runAdapterConformance` is the G3 contract. Neo4j must pass it without changing
  invariant codes.

## Consequences

- G3 implements Neo4j behind `GraphStore`; it must not fork serialization.
- E1/A1/D1 must not edit these contracts; they report required changes here.
- A graph path remains provenance, not legal proof.
