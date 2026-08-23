# ADR 0005: Canonical JSON and deterministic stable IDs

- Node: S1
- Date: 2026-08-22

## Status

Accepted

## Context

`docs/LEGAL_EVIDENCE_GRAPH.md` requires deterministic IDs and canonical serialization.
TypeScript and Python both consume the same contracts. JSON.stringify and json.dumps
disagree on key order and some Unicode escapes, so hashing either encoder would drift.

Citation normalization (R1) is not in scope. Authority identity still needs a stable
placeholder key (`citationKey`) so later nodes can replace the key without changing the
hash algorithm.

## Decision

- Schema catalog `packages/contracts/schemas/v1/catalog.json` is the single source of
  truth for node types, edge types, verdicts, reason codes, prefixes, natural keys, and
  scope. Schema version is `1` / `evidenceops.contracts.v1`.
- Canonical JSON: sorted object keys, no insignificant whitespace, UTF-8, only JSON
  null/bool/string/array/object and safe integers. Control characters in strings are
  `\u00XX`. Identical algorithm in `@evidenceops/contracts` and `evidenceops.contracts`.
- Stable ID: `{prefix}_{sha256(canonicalJson({key, schemaVersion, type}))[:32]}`.
  Natural keys exclude tenant/matter for globally identified authorities so two tenants
  can name the same public opinion; envelopes still carry tenant/matter for isolation.
- Content hash is full SHA-256 hex of snapshot bytes and is distinct from the stable ID.
- Missing connector data and unavailable treatment are catalog states, never success.
- `UNRESOLVED` and `NO_SUPPORT` are never memo-admissible even with an accepted reviewer
  state; G1 will enforce this on memo assembly.

Do not copy Provenance Guard types. These contracts are EvidenceOps-local.

## Consequences

- G1, R1, V1, and A1 consume this catalog instead of inventing parallel enums.
- Changing canonicalization or prefix maps is a single-writer contract change and a new
  schema version.
- R1 may constrain `citationKey` format but must not change the ID algorithm.
