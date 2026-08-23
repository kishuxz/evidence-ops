# O1 baseline (no SLOs)

This file records what to measure. It does not invent availability or latency
SLOs.

Measure before targeting:

- workflow latency p50/p95 from `@evidenceops/obs` and Q1 bench
- workflow cost (token budget units; USD is a fixture conversion, not a vendor invoice)
- connector failures
- retrieval failures
- dead letters
- retries

Until Q1 generates numbers on the current corpus, treat these as unmeasured.
