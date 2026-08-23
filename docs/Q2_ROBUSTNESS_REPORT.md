# Q2 robustness report

Robustness on constructed fixtures. 200/200 on Q1 is not legal reliability, not hallucination elimination, and not production accuracy. I1 is n/a. UNRESOLVED is never counted as correct.

- legalReliabilityClaim: false
- hallucinationFreeClaim: false
- productionAccuracyClaim: false
- unresolvedCountedAsCorrect: false
- provenanceGuard: unavailable

## paraphrase

- total: 8
- correct: 8
- unresolved: 0
- isolationFailures: 0
- p50Ms: 0.008
- p95Ms: 0.314
- precision: {"PARTIAL_SUPPORT":1}
- recall: {"PARTIAL_SUPPORT":1}
- f1: {"PARTIAL_SUPPORT":1}

## distractor

- total: 8
- correct: 8
- unresolved: 0
- isolationFailures: 0
- p50Ms: 0.063
- p95Ms: 0.402
- precision: {"FULL_SUPPORT":1}
- recall: {"FULL_SUPPORT":1}
- f1: {"FULL_SUPPORT":1}

## conflict

- total: 8
- correct: 8
- unresolved: 0
- isolationFailures: 0
- p50Ms: 0.008
- p95Ms: 0.017
- precision: {"CONTRADICTED":1}
- recall: {"CONTRADICTED":1}
- f1: {"CONTRADICTED":1}

## wrong_document

- total: 8
- correct: 8
- unresolved: 0
- isolationFailures: 0
- p50Ms: 0.002
- p95Ms: 0.011
- precision: {"NO_SUPPORT":1}
- recall: {"NO_SUPPORT":1}
- f1: {"NO_SUPPORT":1}

## stale

- total: 8
- correct: 8
- unresolved: 0
- isolationFailures: 0
- p50Ms: 0.001
- p95Ms: 0.009
- precision: {"STALE_AUTHORITY":1}
- recall: {"STALE_AUTHORITY":1}
- f1: {"STALE_AUTHORITY":1}

## jurisdiction

- total: 8
- correct: 8
- unresolved: 0
- isolationFailures: 0
- p50Ms: 0.001
- p95Ms: 0.008
- precision: {"WRONG_JURISDICTION":1}
- recall: {"WRONG_JURISDICTION":1}
- f1: {"WRONG_JURISDICTION":1}

## partial_snapshot

- total: 8
- correct: 0
- unresolved: 8
- isolationFailures: 0
- p50Ms: 0.001
- p95Ms: 0.009
- precision: {"UNRESOLVED":1}
- recall: {"UNRESOLVED":1}
- f1: {"UNRESOLVED":1}

## prompt_injection

- total: 8
- correct: 8
- unresolved: 0
- isolationFailures: 0
- p50Ms: 0.004
- p95Ms: 0.015
- precision: {"NO_SUPPORT":1}
- recall: {"NO_SUPPORT":1}
- f1: {"NO_SUPPORT":1}

## cross_tenant

- total: 8
- correct: 0
- unresolved: 8
- isolationFailures: 0
- p50Ms: 0.009
- p95Ms: 0.022
- precision: {"UNRESOLVED":1}
- recall: {"UNRESOLVED":1}
- f1: {"UNRESOLVED":1}

## citation_perturbation

- total: 8
- correct: 8
- unresolved: 0
- isolationFailures: 0
- p50Ms: 0.003
- p95Ms: 0.010
- precision: {"FULL_SUPPORT":1}
- recall: {"FULL_SUPPORT":1}
- f1: {"FULL_SUPPORT":1}

## abstention

- total: 8
- correct: 0
- unresolved: 8
- isolationFailures: 0
- p50Ms: 0.001
- p95Ms: 0.006
- precision: {"UNRESOLVED":1}
- recall: {"UNRESOLVED":1}
- f1: {"UNRESOLVED":1}

