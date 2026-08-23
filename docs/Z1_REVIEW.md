# Z1 independent reviews

Date: 2026-08-22. Scope: code on `main` through Q1, plus this review PR.
Status: reviews completed; confirmed documentation/test findings repaired in the
same PR. No critical isolation bypass found.

This is **not** Z2. No public release, package publish, or public hosted demo.

## Tenant / matter isolation

Checked: `@evidenceops/auth` matter bindings, G2 `InMemoryGraphStore` partition by
`tenantId+matterId`, G3 Cypher `$tenantId`/`$matterId` on every scoped query,
export redaction of confidential attributes.

Finding: U1/O1 are libraries, not a networked server. Callers must pass scope.
Residual: a future HTTP API must re-apply A1 on every request.

Repair: none in core stores. Documented residual in the release-candidate report.

## RBAC and approval bypass

Checked: `ApprovalPolicy.require` for `publish`; W1 `publish: true` waits;
M1 accepted-conclusion edits require the same approval; audit log is append-only.

Finding: none confirmed. Residual: in-memory policy is process-local.

## Prompt injection and untrusted documents

Checked: EvidenceOps verification does not send snapshot text to an external
model. Matching is `includes` on normalized strings. The model-only Q1 baseline
is a quotation-presence heuristic, not an instruction-following model.

Finding: untrusted-document handling in the core path is fail-closed string
matching. Residual: if an LLM is added later, snapshots must remain untrusted.

Repair: added a verification test that instruction-like snapshot text cannot
force `FULL_SUPPORT`.

## Source licensing and attribution

Checked: Apache-2.0 `LICENSE`; fixture metadata `not CourtListener data`;
eval redistribution strings; ADR 0008.

Finding: none. Residual: live CourtListener remains blocked.

## Legal representation / marketing claims

Checked: README disclaimers, `docs/LIMITATIONS.md`, Q1 report, corpus labels.

Finding: README still described the repo as F0–G2 only and listed CLI commands
that are not shipped binaries.

Repair: README status updated. Commands section now states they are unspecified
binaries, not a shipped CLI.

## Citation and proposition correctness

Checked: V1 engine vs 8 foundation fixtures and 200 synthetic cases (Q1
EvidenceOps 200/200 on this corpus only). Pinpoint is presence, not reporter
geometry.

Finding: pinpoint spatial verification is incomplete (limitation, not a silent
success). Residual: synthetic corpus is not expert-reviewed.

## Temporal-version correctness

Checked: X1 `asOf`/`versionLocator` filters; V1 `STALE_AUTHORITY` on superseded
snapshots; M1 supersession class; G2 immutable hashed snapshots.

Finding: none confirmed.

## Replay safety

Checked: P1 snapshots original runs; dead letters stay failed; UNRESOLVED not
counted correct in Q1.

Finding: none confirmed.

## Secret and confidential-data handling

Checked: `.gitignore` for `.env`/`.context`; connector forbids live credentials;
graph export redacts confidential attributes by default.

Finding: none confirmed. Residual: operators must not log secrets in O1 fields.

## Clean-clone DevEx

Exact gate: Node 20.x, Python ≥3.12, pnpm 10.14.0, `bash scripts/verify.sh`.
A shallow clone of `main` at Q1 (`2d6c3e2`, PR #32) was executed as a pre-Z1
clean-clone check: `bash scripts/verify.sh` returned `verify: ok` without
Neo4j, Docker, or network APIs.

## Deployment and rollback readiness

No production service is deployed. Rollback is `git revert` of a squash merge.
Public deploy remains Z2 and requires separate human authorization.

## I1

Provenance Guard has no stable versioned release. I1 remains an explicit
external dependency. No internals were copied.
