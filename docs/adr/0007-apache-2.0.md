# ADR 0007: Apache License 2.0

- Node: cross-cutting (human license decision)
- Date: 2026-08-22

## Status

Accepted

## Context

ADR 0004 escalated license selection. A human directed that EvidenceOps Legal use the
Apache License, Version 2.0.

## Decision

Add `LICENSE` containing Apache-2.0. Copyright notice: Copyright 2026 Kishore Kumar
Ramkumar. `docs/LICENSE_STATUS.md` records the grant. Public release and deployment
still require a separate Z2 authorization.

## Consequences

- Third parties may use the software under Apache-2.0 terms.
- ADR 0004 is superseded.
- Changing the license requires a new human decision and ADR.
