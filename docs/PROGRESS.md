# Progress

Status values: `not_started`, `blocked`, `in_progress`, `merged`.

Update this table when a node issue is opened, a PR is merged, or a blocker appears.
Do not mark a node `merged` until the squash merge is on `main` and CI is green.

| ID | Work | Depends on | Status | Issue | PR |
| --- | --- | --- | --- | --- | --- |
| F0 | Repository foundation, tooling, CI, ADR template, progress tracking | — | merged | #1 | #2 |
| S1 | Core domain schemas and stable IDs | F0 | merged | #3 | #4 |
| G1 | Evidence graph model and invariants | S1 | merged | #5 | #6 |
| E1 | Evaluation corpus schema, fixture tooling, initial cases | S1 | merged | #8 | #12 |
| D1 | Public federal opinion connector and immutable snapshots | S1 | merged | #10 | #12 |
| R1 | Authority identity, citation normalization, version resolution | D1 | merged | #13 | #14 |
| X1 | Search index and hybrid retrieval | R1 | merged | #16 | #19 |
| V1 | Passage, quotation, pinpoint, and proposition verification | R1, E1 | merged | #15 | #18 |
| G2 | In-memory graph, JSON/JSONL, validation and traversals | G1 | merged | #7 | #11 |
| G3 | Neo4j adapter and conformance suite | G2 | merged | #17 | #20 |
| W1 | Durable research/checkpoint/retry/budget workflow | X1, V1, G2 | merged | #21 | #22 |
| M1 | Authority monitoring, diff, and impact traversal | W1 | merged | #23 | #24 |
| P1 | Failure attribution and research replay | W1, E1 | merged | #25 | #26 |
| A1 | Auth, tenant/matter RBAC, audit and approval policies | S1 | merged | #9 | #12 |
| U1 | Reviewer evidence, conflicts, and redline dashboard | W1, M1, A1 | merged | #27 | #28 |
| O1 | OpenTelemetry, SLO baseline, alerts, runbooks | W1, M1 | merged | #29 | #30 |
| I1 | Provenance Guard monitor adapter | V1, stable external release | blocked | #39 | |
| Q1 | Full benchmark and baseline report | E1, V1, M1, P1 | merged | #31 | #32 |
| Z1 | Threat, claims, correctness, legal-data, and DevEx reviews | required nodes | merged | #33 | #34 |
| C1 | Packaged evidenceops CLI | W1, V1, X1, M1, U1, A1 | in_progress | #35 | |
| D2 | Local private fixture-only demo | C1, A1, W1, M1, U1, O1 | not_started | #36 | |
| E2 | Expert-reviewer package for synthetic corpus | E1, Q1 | not_started | #37 | |
| Q2 | Robustness evaluations | Q1, V1 | not_started | #38 | |
| Z2 | Clean clone, deployment rehearsal, release candidate | Z1 | blocked | | |

## Open escalations

- Live CourtListener/RECAP adapter remains blocked until written Free Law Project authorization (ADR 0008).
- Public release and deployment still require human authorization (Z2).
