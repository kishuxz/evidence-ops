# ADR 0006: Typed evidence graph document and invariant validator

- Node: G1
- Date: 2026-08-22

## Status

Accepted

## Context

S1 defined identities and envelopes. `docs/LEGAL_EVIDENCE_GRAPH.md` requires invariants
before any store. G2 will add in-memory persistence and traversals; G3 adds Neo4j.
Core evaluation must not require Neo4j or network.

A graph path is provenance, not proof of legal correctness.

## Decision

- The graph is a versioned document `{ schemaVersion, nodes, edges }` validated by
  `validateGraph` in `@evidenceops/graph`.
- Nodes are S1 envelopes plus `attributes`. Edges are typed, scoped, and may carry
  `impactKind` `direct` | `transitive`.
- Validator enforces isolation, endpoint existence, SUPPORTS→Passage with an
  AuthorityVersion, citation verification gates, DERIVED_FROM acyclicity, explicit
  data availability, and accepted-memo admission using S1 `propositionAdmissibleInMemo`.
- Python `evidenceops.graph.validate_graph` repeats isolation, endpoint, SUPPORTS, and
  citation gates so workers cannot skip them. Traversals remain G2.

## Consequences

- G2 may persist this document as JSON/JSONL without changing invariant codes.
- Changing an invariant code is a single-writer contract change.
- Connectivity never implies a proposition is legally correct.
