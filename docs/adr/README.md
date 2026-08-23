# Architecture decision records

Record durable choices that later nodes must not silently reverse.

## Process

1. Copy `0000-template.md` to the next number (`0001`, `0002`, …).
2. Fill Context, Decision, and Consequences.
3. Set Status to `Proposed` in the PR that introduces the decision.
4. After squash-merge to `main`, Status is `Accepted` unless a later ADR supersedes it.
5. Shared-contract ADRs (schemas, IDs, verdicts, graph semantics, public APIs, auth,
   policy, CI, releases) are single-writer. Do not land two such ADRs in parallel.

## Index

| ADR | Title | Status |
| --- | --- | --- |
| 0000 | Template | n/a |
| 0001 | Record architecture decisions in `docs/adr` | Accepted with F0 |
| 0002 | Modular monolith plus workers | Accepted with F0 |
| 0003 | Node 20, Python 3.12+, pnpm, pytest, vitest | Accepted with F0 |
| 0004 | Software license requires human decision | Escalated |
