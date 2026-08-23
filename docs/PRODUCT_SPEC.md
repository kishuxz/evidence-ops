# Product specification

## Product promise

Given a bounded legal research matter, EvidenceOps Legal produces a reviewable research
artifact in which every material proposition links to exact authority passages and recorded
applicability conditions. It preserves the research state and alerts reviewers when new or
changed authority may affect prior conclusions.

## Initial user

An attorney, legal researcher, compliance professional, or legal-AI engineer working on
United States federal case-law research. Humans retain responsibility for legal judgment,
client advice, filing, and external action.

## Required journeys

### Create a matter

Record the research question, jurisdictions, as-of date, excluded sources, client facts,
confidentiality boundary, reviewers, monitoring policy, and output format.

### Research

Decompose the question into issues and material propositions; retrieve authoritative
documents; verify document identity; extract passages; construct the graph; synthesize only
from admitted evidence; surface conflicts, gaps, and uncertainty.

### Verify

For each material proposition, verify authority existence and identity, quoted text,
pinpoint location, degree of support, jurisdiction, court/date, version, and known temporal
status available from configured public data. Never infer comprehensive treatment coverage.

### Review

Display proposition, support verdict, passage, source snapshot, retrieval path, conflicts,
uncertainty, and change history. A reviewer can accept, reject, edit, or request more
research, and the decision becomes part of the audit graph.

### Monitor and update

Ingest new versions and authorities; classify meaningful change; traverse dependent
propositions and memos; rerun only affected branches; produce a redline and impact report;
require reviewer approval before replacing an accepted conclusion.

### Replay a failure

Trace an unsupported proposition backward to retrieval, extraction, inference, or version
selection; restore the last valid checkpoint; rerun with the invalid input excluded; record
the correction as an evaluation fixture.

## Verdict contract

`FULL_SUPPORT`, `PARTIAL_SUPPORT`, `NO_SUPPORT`, `CONTRADICTED`,
`WRONG_JURISDICTION`, `STALE_AUTHORITY`, and `UNRESOLVED`. Each verdict records stable reason
codes, method, policy version, evidence IDs, model/retriever versions, and reviewer state.

## Non-goals for v0.1

- Autonomous legal advice, filing, negotiation, or outcome prediction.
- All U.S. jurisdictions or international law.
- Comprehensive subsequent-treatment analysis.
- Replacing commercial citators or attorney review.
- Training a foundation model.
- Ingesting privileged customer documents for the public demo.

## v0.1 release criteria

- Federal opinion ingestion from one public source with immutable snapshots and versioning.
- Deterministic authority identity and citation normalization.
- Hybrid retrieval with wrong-document defenses.
- Temporal evidence graph with validation and tenant/matter isolation tests.
- Proposition extraction and all seven verdict outcomes.
- Exact-passage and quotation verification.
- Research, verification, review, monitoring, impact, and replay APIs/CLI.
- Reviewer dashboard with evidence and redline views.
- Durable jobs, retries, dead letters, idempotency, audit log, RBAC, secrets handling,
  OpenTelemetry, budgets, and failure alerts.
- Versioned evaluation corpus with generated baseline comparison.
- Architecture, threat model, data/license notes, limitations, deployment, and incident
  runbooks.
- Clean-clone deployment and a hosted demo using only public/non-sensitive data.
- No unresolved critical/high security, isolation, correctness, or claims-review finding.
