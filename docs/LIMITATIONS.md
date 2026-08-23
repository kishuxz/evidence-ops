# Limitations and claims control

This file is the claims-control surface. Marketing copy, README summaries, and demo
narratives must not exceed it.

## Current product state

F0–G1 are merged: specs, contracts, and a graph validator exist. There is no live legal
data connector. Offline fixtures are not CourtListener coverage. There is no hosted
demo, evaluation benchmark report, or public release.

## Representation limits (always)

EvidenceOps Legal:

- supports legal research and human review
- does not provide legal advice
- is not a lawyer and is not a substitute for legal judgment
- is not hallucination-free
- is not a comprehensive citator and does not replace Shepard's, KeyCite, Westlaw, Lexis,
  or attorney review
- does not claim coverage of all U.S. jurisdictions or international law
- does not perform comprehensive subsequent-treatment analysis
- does not autonomously file, negotiate, or predict case outcomes

A graph path is provenance, not proof that a proposition is legally correct. Unsupported
and unresolved propositions cannot silently enter a final reviewed memo.

External papers cited in `docs/EVALUATION_PLAN.md` motivate the benchmark. They are not
EvidenceOps performance. Only reports generated from this repository's versioned fixtures
and current code may be cited as our results.

## Data and evaluation limits (v0.1 target)

- The networked CourtListener/RECAP adapter is blocked (ADR 0008). D1 is fixture-only.
- Fixture snapshots are not live CourtListener coverage and must not be described as such.
- Immutable snapshots record what was admitted, not that any source is complete.
- Missing connector data and unavailable treatment data remain explicit unknowns.
- The evaluation corpus must not contain privileged client material.
- Core evaluation must run offline from versioned fixtures without Neo4j or network.

## Integration limits

Provenance Guard is not copied into this repository. Integration happens only through a
versioned adapter after a stable external release, and only in monitor mode before
enforcement.
