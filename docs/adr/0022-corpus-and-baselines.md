# ADR 0022: Synthetic 200-case corpus and offline baselines

- Node: Q1
- Date: 2026-08-22

## Status

Proposed

## Context

The eight initial cases are foundation fixtures. The v0.1 target is 200 cases.
No qualified legal expert has reviewed this corpus. Provenance Guard has no
stable versioned release (I1 blocked).

## Decision

- Expand to 200 **synthetic constructed single-author engineering fixtures
  awaiting expert review**. Do not label them expert-reviewed.
- Offline baselines: model-only, basic vector RAG, hybrid retrieval with
  citations, EvidenceOps graph+V1 verification. Provenance Guard is omitted.
- UNRESOLVED is never counted as correct. Reports include confusion matrices,
  unresolved counts, p50/p95 latency, and fixture cost units.

## Consequences

- Naturally occurring, independently reviewed, and public-source cases remain
  zero until a qualified reviewer and licensed sources exist.
