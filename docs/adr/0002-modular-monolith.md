# ADR 0002: Modular monolith plus workers

- Node: F0
- Date: 2026-08-22

## Status

Accepted

## Context

`docs/ARCHITECTURE.md` requires TypeScript control-plane, Python workers, durable
workflows, PostgreSQL, object storage, search, a Neo4j adapter, a queue, OpenTelemetry,
and a React reviewer dashboard. It also forbids creating microservices only to look
production-grade.

## Decision

Begin as a modular monolith plus workers. Required service boundaries remain logical
packages (`source-ingestion`, `authority-resolution`, `retrieval`,
`research-orchestrator`, `citation-verifier`, `graph-service`, `monitoring-impact`,
`review-approval`, `evaluation`, `artifact-export`) inside this repository until measured
load or isolation requires a split.

Python lives under `src/evidenceops/` for workers, parsing, retrieval evaluation, claim
extraction, and models. TypeScript packages live under `packages/` for API, CLI, and
shared contracts. The reviewer UI will be added as an app in a later node, not as an
empty placeholder in F0.

Core evaluation must not require Neo4j or network.

## Consequences

- F0 does not create empty microservice repos or fake HTTP stubs.
- S1 and later nodes add packages under these roots instead of inventing a new layout.
- Splitting a boundary into a separate deployable unit requires a new ADR and evidence.
