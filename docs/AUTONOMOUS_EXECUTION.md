# Autonomous execution plan

## Loop

`inspect -> select unblocked node -> issue/spec -> failing test -> implement -> focused
verification -> full verification -> adversarial/security/claims review -> repair -> PR ->
green CI -> squash merge -> refresh main -> repeat`.

## Dependency graph

| ID | Work | Depends on | Mode |
| --- | --- | --- | --- |
| F0 | Repository foundation, tooling, CI, ADR template, progress tracking | — | single writer |
| S1 | Core domain schemas and stable IDs | F0 | single writer |
| G1 | Evidence graph model and invariants | S1 | single writer |
| E1 | Evaluation corpus schema, fixture tooling, initial cases | S1 | isolated fixture lane |
| D1 | Public federal opinion connector and immutable snapshots | S1 | connector lane |
| R1 | Authority identity, citation normalization, version resolution | D1 | single writer |
| X1 | Search index and hybrid retrieval | R1 | isolated lane |
| V1 | Passage, quotation, pinpoint, and proposition verification | R1, E1 | single writer |
| G2 | In-memory graph, JSON/JSONL, validation and traversals | G1 | isolated lane |
| G3 | Neo4j adapter and conformance suite | G2 | isolated lane |
| W1 | Durable research/checkpoint/retry/budget workflow | X1, V1, G2 | single writer |
| M1 | Authority monitoring, diff, and impact traversal | W1 | single writer |
| P1 | Failure attribution and research replay | W1, E1 | isolated lane |
| A1 | Auth, tenant/matter RBAC, audit and approval policies | S1 | single writer |
| U1 | Reviewer evidence, conflicts, and redline dashboard | W1, M1, A1 | frontend lane |
| O1 | OpenTelemetry, SLO baseline, alerts, runbooks | W1, M1 | single writer |
| I1 | Provenance Guard monitor adapter | V1, stable external release | single writer |
| Q1 | Full benchmark and baseline report | E1, V1, M1, P1 | evaluation lane |
| Z1 | Threat, claims, correctness, legal-data, and DevEx reviews | required nodes | read-only lanes |
| Z2 | Clean clone, deployment rehearsal, release candidate | Z1 | single writer |

Only implementation nodes with merged dependencies may start. Fixture expansion, source
coverage research, threat modeling, and read-only reviews may proceed in parallel.

## Stop conditions

Request human direction for license selection, data-source terms ambiguity, collection of
private/privileged data, public package/release/deployment, paid services, external writes,
core verdict changes, destructive migration, unresolved critical/high security or isolation
issues, or inability to run required verification. Ordinary implementation and CI failures
remain inside the repair loop.

## Final report

List issues/PRs in dependency order, architecture and package inventory, data sources and
coverage limits, exact verification, generated benchmark results, cost/latency environment,
security/claims findings, remaining limitations, deployment evidence, and approvals still
required.
