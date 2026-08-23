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

Foundation work F0–G2 is merged. See `docs/PROGRESS.md`. v0.1 is not complete.

Licensed under Apache License 2.0. See `LICENSE` and `docs/LICENSE_STATUS.md`.
The networked CourtListener adapter is blocked; see ADR 0008.

## Verification

Requires Node 20.x, Python 3.12+, and pnpm 10.x. The verify script creates `.venv`
and installs Python dev extras there.

```bash
bash scripts/verify.sh
```

This is the same gate CI runs. Do not merge a change that fails it.

## Intended commands

```bash
evidenceops matter create
evidenceops research run
evidenceops citation verify
evidenceops graph validate
evidenceops authority monitor
evidenceops impact explain
evidenceops replay
evidenceops eval run
```

Commands are required product behavior, not an assertion that they already exist.

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
- `docs/PROGRESS.md`
- `docs/adr/`
