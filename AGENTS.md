# EvidenceOps Legal engineering contract

This file governs every coding agent and Conductor worktree in this repository.

## Mission

Build a production-shaped legal research-support system that makes material propositions
traceable to exact authority passages, preserves authority versions, detects invalidated
conclusions, and keeps a human reviewer in control of legal judgment and external actions.

## Required reading order

1. `docs/PRODUCT_SPEC.md`
2. `docs/LEGAL_EVIDENCE_GRAPH.md`
3. `docs/ARCHITECTURE.md`
4. `docs/EVALUATION_PLAN.md`
5. `docs/AUTONOMOUS_EXECUTION.md`

## Engineering loop

For each work node: inspect current main and CI; create a focused issue with scope,
non-goals, risks, and acceptance tests; branch from main; write a failing test when
practical; implement the smallest coherent change; run focused and full verification;
perform adversarial, security, and claims review; repair; open a PR; merge only after green
CI; update main; continue with the next unblocked node.

Never commit directly to main, force-push main, merge red CI, weaken tests for convenience,
or add AI attribution to commits and PRs.

## Safety and truthfulness

- The product supports legal research; it does not provide autonomous legal advice.
- Never market the system as hallucination-free, comprehensive, or equivalent to Shepard's,
  KeyCite, Westlaw, Lexis, or attorney review.
- A graph path is provenance, not proof that a proposition is legally correct.
- Every material generated proposition must be `FULL_SUPPORT`, `PARTIAL_SUPPORT`,
  `NO_SUPPORT`, `CONTRADICTED`, `WRONG_JURISDICTION`, `STALE_AUTHORITY`, or `UNRESOLVED`.
- Unsupported and unresolved propositions cannot silently enter a final reviewed memo.
- Preserve immutable source snapshots and the exact policy/model/retrieval versions used.
- Models may propose research paths; deterministic identity, citation, permission, and
  version checks remain authoritative.
- Never use confidential or privileged material in fixtures.
- Enforce tenant and matter isolation in storage, queries, caches, logs, and graph traversal.
- External writes, notifications, publication, and release require policy checks and human
  approval.

## Production constraints

- Durable, idempotent jobs with bounded retries and dead-letter handling.
- At-least-once events must not create duplicate sources, claims, alerts, or actions.
- Connector failures and partial ingestion are explicit states, never empty success.
- Core evaluation is reproducible offline from versioned fixtures.
- Secrets are stored in an approved secret manager and never logged.
- Every research run emits OpenTelemetry traces and cost/latency metrics.
- Database and graph migrations are single-writer, reviewed, reversible where practical,
  and never run autonomously against production.

## Conductor concurrency

Single writer with independent review: shared schemas, authority identity, temporal
semantics, verdicts, public APIs, migrations, auth/RBAC, policy, root configuration, CI, and
release changes.

Safe parallel lanes after interfaces are merged: isolated public-source connectors,
evaluation fixtures, frontend views, read-only legal/claims review, threat modeling, and
clean-clone DevEx testing. Agents must not edit the same contract files in parallel.

## Completion

Complete means every v0.1 criterion in `docs/PRODUCT_SPEC.md` is evidenced, required work
nodes are merged, clean-clone verification passes, benchmark results are generated from
current code, security and claims reviews have no unresolved critical/high finding, and a
human explicitly authorizes any public release.
