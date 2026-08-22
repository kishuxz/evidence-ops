# Production architecture

## Components

- TypeScript API/control plane for tenants, matters, policies, reviews, and actions.
- Python workers for document parsing, retrieval evaluation, claim extraction, and models.
- Durable workflow engine for research, monitoring, retries, approvals, and replay.
- PostgreSQL for operational state, auth/RBAC, jobs, budgets, and audit metadata.
- Object storage for immutable source snapshots and generated artifacts.
- Search/vector index for hybrid retrieval.
- Neo4j adapter for temporal evidence and impact traversal.
- Queue/event bus with idempotent consumers and dead-letter handling.
- OpenTelemetry traces, metrics, structured logs, and correlation IDs.
- React reviewer dashboard.

## Required service boundaries

`source-ingestion`, `authority-resolution`, `retrieval`, `research-orchestrator`,
`citation-verifier`, `graph-service`, `monitoring-impact`, `review-approval`, `evaluation`,
and `artifact-export`.

Begin as a modular monolith plus workers unless measured load or isolation requires separate
services. Do not create microservices only to make the diagram look production-grade.

## Data sources

The first connector should use CourtListener/RECAP or another authorized public federal
opinion source. Later connectors may include Congress.gov, GovInfo, eCFR, Federal Register,
and official agency/court sites. Each connector must document licensing, rate limits,
coverage, version semantics, deletion handling, and failure behavior.

## Durable research workflow

`scope -> plan -> retrieve -> resolve authority -> extract -> graph -> verify -> synthesize
-> review -> persist -> monitor`. Each step has typed input/output, idempotency key, timeout,
retry policy, cost budget, and checkpoint. Partial completion cannot appear as success.

## Security

OIDC/session authentication, tenant/matter RBAC, least-privilege connectors, encrypted
transport/storage, secret manager, audit trails, prompt-injection defenses, safe rendering,
content-size limits, malware/untrusted-file handling, egress policy, and retention/deletion
workflows are required. Threat modeling precedes private-data ingestion.

## Observability and SLOs

Measure ingestion lag, source failures, wrong-document rate, citation verification latency,
unsupported proposition rate, monitor-to-alert delay, queue age, retries, dead letters,
model/retrieval cost, review backlog, and tenant-isolation violations. Define SLOs only after
collecting baseline measurements; never invent production numbers.

## Provenance Guard integration

Use an adapter after Provenance Guard exposes a stable versioned interface. Map EvidenceOps
authority/passages and proposition verdicts without copying internal implementation. Run in
monitor mode first, compare results, then enable enforcement after regression review.
