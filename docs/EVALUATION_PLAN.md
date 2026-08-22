# Evaluation plan

## Research claims motivating the benchmark

- Specialized legal research tools were reported to hallucinate in 17–33% of evaluated
  answers: arXiv:2405.20362 / DOI 10.1111/jels.12413.
- General LLMs have shown substantially higher legal hallucination rates and poor correction
  of false premises: DOI 10.1093/jla/laae003.
- Citation support can be full, partial, or absent, and no single automated metric dominates:
  arXiv:2406.15264.
- Large legal corpora create document-level retrieval mismatch: arXiv:2510.06999 and
  DOI 10.18653/v1/2025.nllp-1.3.
- Dynamic legal knowledge requires domain-specific update evaluation: LeKUBE,
  DOI 10.1145/3673791.3698407.

Treat external results as motivation, not our performance. Reproduce only claims supported
by our own versioned fixtures and generated reports.

## v0.1 corpus

At least 200 expert-reviewable cases: 50 full support, 30 partial support, 30 real authority
but no proposition support, 20 fabricated authorities, 20 wrong quotations/pinpoints, 20
wrong jurisdiction, 15 stale/superseded simulations, and 15 wrong-document retrievals.

Temporal cases include amended/repealed text, corrected citation, new conflicting authority,
changed effective date, withdrawn guidance, reversal, limitation, and source deletion.

No fixture may contain privileged client material. Every expected result cites the public
source snapshot and records annotation rationale and reviewer identity/version.

## Baselines

1. Model-only answer.
2. Basic vector RAG.
3. Hybrid retrieval with citation rendering.
4. EvidenceOps graph and deterministic verification.
5. EvidenceOps plus Provenance Guard after integration.

Use the same corpus, models, source snapshot, budgets, and evaluation policy.

## Metrics

Citation existence, authority identity, quotation/pinpoint verification, full/partial/no
support classification, wrong-document detection, wrong-jurisdiction detection,
stale-authority recall, change-impact precision/recall, false update alerts, research replay
recovery, human correction rate, time/cost per matter, p50/p95 latency, and system overhead.

Report confusion matrices and confidence intervals where appropriate. Separate deterministic
checks, model graders, and human judgments. Never collapse unresolved cases into correct.

## Release gate

The report is generated in CI from versioned fixtures. Any regression beyond an explicitly
reviewed tolerance blocks merge. Dataset leakage, annotation conflicts, and evaluator/model
changes are versioned and disclosed.
