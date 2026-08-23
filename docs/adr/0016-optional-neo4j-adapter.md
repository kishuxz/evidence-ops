# ADR 0016: Optional Neo4j adapter

- Node: G3
- Date: 2026-08-22

## Status

Proposed

## Context

G2 defined `GraphStore` and `runAdapterConformance`. Evaluation and core CI must
keep working without Docker, Neo4j, network, or credentials. A live adapter must
not be declared complete from mocks.

## Decision

- `@evidenceops/graph-neo4j` is optional. Core `pnpm test` / `scripts/verify.sh`
  stay green when `NEO4J_URI` is unset; live tests skip and status is
  `unverified`.
- Every scoped Cypher statement is parameterized and includes `$tenantId` and
  `$matterId`. Nodes and edges are isolated by those scope properties.
- Uniqueness constraints and scope indexes are created when a live engine is
  available. Import of a scope is a single write transaction.
- The adapter implements `AsyncGraphStore` and must pass
  `runAsyncAdapterConformance` against a real Neo4j process before status is
  `verified`.
- In-memory G2 remains the default store. G3 does not change verdict semantics.

## Consequences

- CI does not start Neo4j. A local or container engine is required for
  verification evidence.
- Failure to obtain a real engine is documented as unverified, not as a passing
  integration.
