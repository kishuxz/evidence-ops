# Conductor launch prompt

Paste this into the primary Conductor workspace after attaching the repository.

Build EvidenceOps Legal to the v0.1 release criteria defined in this repository.

Before editing, read AGENTS.md, CLAUDE.md, README.md, and every file in docs/. Inspect the
current repository, branches, issues, PRs, CI, and environment. Treat documentation, tests,
and implementation as evidence to reconcile, not as automatically complete or correct.

Execute the dependency graph in docs/AUTONOMOUS_EXECUTION.md as focused issues and PRs. Do
not build the roadmap in one branch. Keep schemas, stable IDs, graph semantics, verdicts,
public APIs, migrations, auth/RBAC, policy, root config, CI, and releases under one primary
writer at a time. Use parallel lanes only where file ownership and dependencies are
independent.

For each node, loop: inspect -> specify -> failing test -> implement -> focused tests -> full
verification -> adversarial/security/claims review -> repair -> PR -> green CI -> squash
merge -> update main. Do not add placeholders, fake connectors, invented legal coverage,
unverifiable benchmark claims, weakened tests, or AI attribution.

Begin with F0. In parallel, allow read-only threat/data-source review and evaluation-fixture
research, but no second agent may edit shared contracts. After S1 merges, schedule G1 as the
sole shared-contract writer while E1 and D1 use isolated ownership. Continue only when each
dependency is merged.

Build production behavior: durable idempotent workflows, bounded retries, dead letters,
tenant/matter isolation, RBAC, audit, immutable source snapshots, exact failure states,
budgets, OpenTelemetry, safe approvals, reproducible evaluation, and documented runbooks.
The system supports legal research and human review; it must never represent itself as a
lawyer, comprehensive citator, hallucination-free system, or substitute for legal judgment.

Do not copy Provenance Guard internals. Continue EvidenceOps independently and integrate
through a versioned adapter only after Provenance Guard provides a stable release. Run that
adapter in monitor mode before enforcement.

Stop only for the explicit escalation conditions in docs/AUTONOMOUS_EXECUTION.md. Do not
claim completion until every v0.1 criterion is evidenced, a clean clone passes the full
gate, benchmark results are generated from current code, and required reviews have no
unresolved critical/high finding. Produce the required final report and wait for human
authorization before public release or deployment.

## Initial lanes

Primary: F0, then sole ownership of S1.

Research/data lane: read-only public-source coverage and terms review.

Evaluation lane: read-only fixture plan until S1 merges, then isolated E1 work.

Security/claims lane: read-only threat and representation-risk review.

Do not start several implementation lanes against an empty repository. Parallel coding
begins after shared contracts merge.
