# ADR 0004: Software license requires human decision

- Node: F0
- Date: 2026-08-22

## Status

Superseded by ADR 0007


## Context

`docs/AUTONOMOUS_EXECUTION.md` lists license selection as a stop condition requiring
human direction. The GitHub repository has no license. Choosing MIT, Apache-2.0, GPL, or
a proprietary grant would be inventing a legal position the agent is not authorized to
take.

## Decision

Do not add a `LICENSE` file. Record the gap in `docs/LICENSE_STATUS.md`. Public package
publication, public GitHub visibility changes, and Z2 release cannot proceed until a
human selects a license and an ADR records it.

## Consequences

- F0 can merge without pretending the project is open source or that a license exists.
- Z2 remains blocked on this decision even if other nodes complete.
- Downstream users have no license grant today.
