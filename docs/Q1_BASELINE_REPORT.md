# Q1 baseline report

Generated from `@evidenceops/bench` on the 200-case synthetic engineering corpus.
UNRESOLVED is never counted as correct. Provenance Guard (I1) is unavailable.
Latency is a local measurement, not an SLO. Cost is a fixture unit conversion, not a vendor invoice.

## model_only

- total: 200
- correct: 50
- unresolved: 0
- unresolvedCountedAsCorrect: false
- p50Ms: 0.000
- p95Ms: 0.000
- costUsd (fixture units): 0.2
- provenanceGuard: unavailable

Confusion (expected → predicted counts):

```json
{
  "FULL_SUPPORT": {
    "FULL_SUPPORT": 50
  },
  "PARTIAL_SUPPORT": {
    "FULL_SUPPORT": 30
  },
  "NO_SUPPORT": {
    "FULL_SUPPORT": 85
  },
  "WRONG_JURISDICTION": {
    "FULL_SUPPORT": 20
  },
  "STALE_AUTHORITY": {
    "FULL_SUPPORT": 15
  }
}
```

## vector_rag

- total: 200
- correct: 120
- unresolved: 0
- unresolvedCountedAsCorrect: false
- p50Ms: 0.813
- p95Ms: 0.944
- costUsd (fixture units): 0.2
- provenanceGuard: unavailable

Confusion (expected → predicted counts):

```json
{
  "FULL_SUPPORT": {
    "FULL_SUPPORT": 50
  },
  "PARTIAL_SUPPORT": {
    "NO_SUPPORT": 30
  },
  "NO_SUPPORT": {
    "NO_SUPPORT": 70,
    "FULL_SUPPORT": 15
  },
  "WRONG_JURISDICTION": {
    "FULL_SUPPORT": 20
  },
  "STALE_AUTHORITY": {
    "FULL_SUPPORT": 15
  }
}
```

## hybrid_citations

- total: 200
- correct: 105
- unresolved: 0
- unresolvedCountedAsCorrect: false
- p50Ms: 0.910
- p95Ms: 1.023
- costUsd (fixture units): 0.2
- provenanceGuard: unavailable

Confusion (expected → predicted counts):

```json
{
  "FULL_SUPPORT": {
    "FULL_SUPPORT": 50
  },
  "PARTIAL_SUPPORT": {
    "FULL_SUPPORT": 30
  },
  "NO_SUPPORT": {
    "FULL_SUPPORT": 30,
    "NO_SUPPORT": 55
  },
  "WRONG_JURISDICTION": {
    "FULL_SUPPORT": 20
  },
  "STALE_AUTHORITY": {
    "FULL_SUPPORT": 15
  }
}
```

## evidenceops

- total: 200
- correct: 200
- unresolved: 0
- unresolvedCountedAsCorrect: false
- p50Ms: 0.002
- p95Ms: 0.005
- costUsd (fixture units): 0.6
- provenanceGuard: unavailable

Confusion (expected → predicted counts):

```json
{
  "FULL_SUPPORT": {
    "FULL_SUPPORT": 50
  },
  "PARTIAL_SUPPORT": {
    "PARTIAL_SUPPORT": 30
  },
  "NO_SUPPORT": {
    "NO_SUPPORT": 85
  },
  "WRONG_JURISDICTION": {
    "WRONG_JURISDICTION": 20
  },
  "STALE_AUTHORITY": {
    "STALE_AUTHORITY": 15
  }
}
```

