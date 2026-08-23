# Architecture decision records

Record durable choices that later nodes must not silently reverse.

## Process

1. Copy `0000-template.md` to the next number (`0001`, `0002`, …).
2. Fill Context, Decision, and Consequences.
3. Set Status to `Proposed` in the PR that introduces the decision.
4. After squash-merge to `main`, Status is `Accepted` unless a later ADR supersedes it.
5. Shared-contract ADRs (schemas, IDs, verdicts, graph semantics, public APIs, auth,
   policy, CI, releases) are single-writer. Do not land two such ADRs in parallel.

## Index

| ADR | Title | Status |
| --- | --- | --- |
| 0000 | Template | n/a |
| 0001 | Record architecture decisions in `docs/adr` | Accepted with F0 |
| 0002 | Modular monolith plus workers | Accepted with F0 |
| 0003 | Node 20, Python 3.12+, pnpm, pytest, vitest | Accepted with F0 |
| 0004 | Software license requires human decision | Superseded by 0007 |
| 0005 | Canonical JSON and deterministic stable IDs | Accepted with S1 |
| 0006 | Typed evidence graph document and invariant validator | Accepted with G1 |
| 0007 | Apache License 2.0 | Accepted |
| 0008 | CourtListener live adapter blocked; D1 fixture-only | Accepted |
| 0009 | In-memory graph store, JSON/JSONL, adapter contract | Accepted with G2 |
| 0010 | Initial evaluation corpus is synthetic and incomplete | Accepted with E1 |
| 0011 | In-process auth, RBAC, audit, and approval policy | Accepted with A1 |
| 0012 | Source-neutral fixture connector (no live CourtListener) | Accepted with D1 |
| 0013 | Fixture-backed citation identity | Accepted with R1 |
| 0014 | Deterministic proposition verification | Accepted with V1 |
| 0015 | Offline hybrid retrieval | Accepted with X1 |
| 0016 | Optional Neo4j adapter | Accepted with G3 |
| 0017 | Durable offline research workflow | Accepted with W1 |
| 0018 | Authority-version monitoring and redlines | Accepted with M1 |
| 0019 | Failure attribution and research replay | Accepted with P1 |
| 0020 | Reviewer evidence view | Accepted with U1 |
| 0021 | Telemetry baseline without invented SLOs | Accepted with O1 |
| 0022 | Synthetic 200-case corpus and offline baselines | Accepted with Q1 |
| 0023 | Stop before Z2 after independent Z1 reviews | Accepted with Z1 |
| 0024 | Packaged local CLI, not a published package | Accepted with C1 |
| 0025 | Local private fixture-only demo, not a public host | Accepted with D2 |
| 0026 | Expert-reviewer package does not complete expert review | Proposed with E2 |
