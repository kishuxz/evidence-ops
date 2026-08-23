# ADR 0008: CourtListener live adapter blocked; D1 is fixture-only

- Node: D1 / data-source
- Date: 2026-08-22

## Status

Accepted

## Context

Architecture names CourtListener/RECAP as a candidate first connector. Free Law Project
membership and API terms do not, by themselves, authorize this product to call, scrape,
or authenticate to CourtListener. A human directed:

- Do not call, scrape, authenticate to, or build a live CourtListener/RECAP connector
  until written authorization or an appropriate agreement with Free Law Project.
- Do not use personal, educational, membership, MCP, or API credentials to power the
  product.

## Decision

The networked CourtListener/RECAP adapter is **blocked**.

D1 may implement only:

- a source-neutral connector contract
- a deterministic fixture-based connector
- immutable snapshot and versioning interfaces
- rate-limit, coverage, licensing, and failure metadata schemas
- connector conformance tests
- offline public/non-sensitive fixtures whose redistribution rights are documented

Fixture coverage must not be represented as live CourtListener coverage. Evaluation and
demos use synthetic or other documented public/non-sensitive snapshots only.

## Consequences

- No HTTP/MCP/API client to courtlistener.com, recap, or PACER lands until a later ADR
  records written authorization.
- CI and evaluation remain offline.
- R1 may normalize citations against fixture snapshots, not a live citator.
