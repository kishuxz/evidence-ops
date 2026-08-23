# Legal evidence graph

## Principle

The graph records why a conclusion was reached and which evidence may invalidate it. It does
not replace legal interpretation or prove truth by connectivity.

## Nodes

`Tenant`, `User`, `Matter`, `ResearchQuestion`, `ClientFact`, `Issue`, `Jurisdiction`,
`LegalProposition`, `Authority`, `AuthorityVersion`, `Court`, `Opinion`, `Passage`,
`Citation`, `Retrieval`, `ResearchRun`, `Conclusion`, `Memo`, `Verdict`, `Policy`,
`ReviewerDecision`, `ChangeEvent`, and `Action`.

Every evidence node has a tenant/matter scope where applicable, schema version, stable ID,
source locator, retrieval timestamp, content hash, and redaction classification.

## Relationships

`RAISES`, `GOVERNS`, `ASSERTS`, `CITES`, `QUOTES`, `SUPPORTS`, `PARTIALLY_SUPPORTS`,
`CONTRADICTS`, `INTERPRETS`, `AMENDS`, `SUPERSEDES`, `REVERSES`, `LIMITS`, `DISTINGUISHES`,
`EFFECTIVE_IN`, `DERIVED_FROM`, `DEPENDS_ON`, `EVALUATED_BY`, `DECIDES`, `INVALIDATES`,
`REVIEWED_BY`, and `REPLAYED_AS`.

## Invariants

1. IDs and canonical serialization are deterministic.
2. Every edge endpoint exists and satisfies tenant/matter isolation.
3. Source snapshots and accepted reviewer decisions are immutable; corrections append.
4. `SUPPORTS` targets an exact passage in an identified authority version.
5. A material proposition cannot be included in an accepted memo without an explicit
   verdict and reviewer state.
6. A citation cannot be treated as verified until identity, passage, and proposition checks
   complete.
7. `DERIVED_FROM` and version ancestry are acyclic.
8. Change impact paths preserve direct/transitive distinction and deterministic ordering.
9. Missing connector data and unavailable treatment data remain explicit unknowns.
10. Exports redact secrets and confidential matter data by default.

## Required traversals

- Backward evidence trace: conclusion to proposition, passage, authority version, and source.
- Contradiction trace: proposition to conflicting authorities and applicability differences.
- Change impact: authority version/change to affected propositions, conclusions, and memos.
- Reviewer trace: accepted text to reviewer decision and evidence visible at decision time.
- Failure replay: invalid output to earliest unsupported retrieval/extraction/inference step.

## Storage order

Implement typed graph model, invariant validator, in-memory store, canonical JSON/JSONL,
adapter conformance suite, then Neo4j. Core evaluation must not require Neo4j or network.
