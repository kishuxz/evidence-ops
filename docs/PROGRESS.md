# Progress

Status values: `not_started`, `blocked`, `in_progress`, `merged`.

Update this table when a node issue is opened, a PR is merged, or a blocker appears.
Do not mark a node `merged` until the squash merge is on `main` and CI is green.

| ID | Work | Depends on | Status | Issue | PR |
| --- | --- | --- | --- | --- | --- |
| F0 | Repository foundation, tooling, CI, ADR template, progress tracking | — | merged | #1 | #2 |
| S1 | Core domain schemas and stable IDs | F0 | in_progress | #3 | |
| G1 | Evidence graph model and invariants | S1 | blocked | | |
| E1 | Evaluation corpus schema, fixture tooling, initial cases | S1 | blocked | | |
| D1 | Public federal opinion connector and immutable snapshots | S1 | blocked | | |
| R1 | Authority identity, citation normalization, version resolution | D1 | blocked | | |
| X1 | Search index and hybrid retrieval | R1 | blocked | | |
| V1 | Passage, quotation, pinpoint, and proposition verification | R1, E1 | blocked | | |
| G2 | In-memory graph, JSON/JSONL, validation and traversals | G1 | blocked | | |
| G3 | Neo4j adapter and conformance suite | G2 | blocked | | |
| W1 | Durable research/checkpoint/retry/budget workflow | X1, V1, G2 | blocked | | |
| M1 | Authority monitoring, diff, and impact traversal | W1 | blocked | | |
| P1 | Failure attribution and research replay | W1, E1 | blocked | | |
| A1 | Auth, tenant/matter RBAC, audit and approval policies | S1 | blocked | | |
| U1 | Reviewer evidence, conflicts, and redline dashboard | W1, M1, A1 | blocked | | |
| O1 | OpenTelemetry, SLO baseline, alerts, runbooks | W1, M1 | blocked | | |
| I1 | Provenance Guard monitor adapter | V1, stable external release | blocked | | |
| Q1 | Full benchmark and baseline report | E1, V1, M1, P1 | blocked | | |
| Z1 | Threat, claims, correctness, legal-data, and DevEx reviews | required nodes | blocked | | |
| Z2 | Clean clone, deployment rehearsal, release candidate | Z1 | blocked | | |

## Open escalations

- Software license is not selected. See `docs/LICENSE_STATUS.md`.
- CourtListener/RECAP product-use terms need human confirmation before D1. See `docs/research/courtlistener-terms.md`.
