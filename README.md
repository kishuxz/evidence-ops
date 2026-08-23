# EvidenceOps Legal

EvidenceOps Legal is a continuous legal-research and citation-integrity system. It
represents legal questions, propositions, citations, authority versions, jurisdictions,
conclusions, and reviewer decisions as a temporal evidence graph. It verifies whether each
material proposition is actually supported, detects authority changes, identifies affected
prior work, and produces human-reviewable updates.

This repository is specification-first. Read `AGENTS.md`, then `CLAUDE.md` and the files in
`docs/` before implementation.

## Disclaimers

EvidenceOps Legal supports legal research and human review. It is **not legal advice**, not
a lawyer, not a substitute for legal judgment, not hallucination-free, and not a
comprehensive citator or replacement for Shepard's, KeyCite, Westlaw, Lexis, or attorney
review. A graph path is provenance, not proof that a proposition is legally correct.

## Initial scope

The v0.1 wedge is United States federal case-law research using public sources. It is a
research-support and verification product, not legal advice, a lawyer replacement, outcome
prediction, or a comprehensive proprietary citator.

## Why this exists

Recent empirical work reports recurring failures in legal AI:

- specialized legal research tools produced hallucinations in 17–33% of evaluated answers;
- citations can exist while only partially or not at all supporting the proposition;
- structurally similar legal documents cause wrong-document retrieval;
- statutes, regulations, guidance, and precedent change after a memo is written.

The system is evaluated against those failure modes instead of subjective answer quality.
External papers motivate the benchmark; they are not EvidenceOps performance claims.

## Repository status

Implementation nodes F0–Z1 are merged. C1 packages a local `evidenceops` CLI;
it is **not** published to npm. I1 (Provenance Guard) and live CourtListener remain
blocked. **Z2 public release, package publish, and public hosted demo are not
authorized.**

Licensed under Apache License 2.0. See `LICENSE` and `docs/LICENSE_STATUS.md`.
The networked CourtListener adapter is blocked; see ADR 0008.

See `docs/PROGRESS.md` and `docs/RELEASE_CANDIDATE.md`.

## Verification

Requires Node 20.x, Python 3.12+, and pnpm 10.x. The verify script creates `.venv`
and installs Python dev extras there.

```bash
bash scripts/verify.sh
```

This is the same gate CI runs. Do not merge a change that fails it.

## CLI

A locally packaged `evidenceops` binary lives in `@evidenceops/cli`. That package
is private and **is not published** to the npm registry. Packing a tarball from
this repository is not a Z2 release. See `docs/CLI.md`.

```bash
pnpm --filter @evidenceops/cli build
evidenceops ingest --tenant T --matter M --token TOKEN --ids fixture.widget.v1
evidenceops retrieve --tenant T --matter M --token TOKEN --text "..."
evidenceops verify --tenant T --matter M --token TOKEN --proposition "..." --quotation "..." --pinpoint "..." --citation "..."
evidenceops trace --tenant T --matter M --token TOKEN --start-id NODE
evidenceops impact --tenant T --matter M --token TOKEN --version-id VERSION
evidenceops review --tenant T --matter M --token TOKEN --proposition-id ID
evidenceops evaluate --tenant T --matter M --token TOKEN
evidenceops graph validate --tenant T --matter M --token TOKEN --file graph.json
```

## Documentation

- `docs/PRODUCT_SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/LEGAL_EVIDENCE_GRAPH.md`
- `docs/EVALUATION_PLAN.md`
- `docs/AUTONOMOUS_EXECUTION.md`
- `docs/CONDUCTOR_LAUNCH.md`
- `docs/EVALUATION_CORPUS.md`
- `docs/CONNECTORS.md`
- `docs/LIMITATIONS.md`
- `docs/Z1_REVIEW.md`
- `docs/RELEASE_CANDIDATE.md`
- `docs/CLI.md`
- `docs/DEMO.md`
- `docs/FOUNDER_DEMO.md`
- `docs/PROGRESS.md`
- `docs/adr/`
