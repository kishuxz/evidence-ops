# Contributing

Read `AGENTS.md` completely, then the files listed in its required reading order.

## Loop

For each work node: inspect current `main` and CI; open a focused issue; branch from
`main`; write a failing test when practical; implement the smallest coherent change; run
focused and full verification; perform adversarial, security, and claims review; open a
PR; merge only after green CI.

Never commit directly to `main`, force-push `main`, merge red CI, weaken tests for
convenience, or add AI attribution to commits and PRs.

## Verification

```bash
bash scripts/verify.sh
```

## Shared contracts

Schemas, stable IDs, graph semantics, verdicts, public APIs, migrations, auth/RBAC,
policy, root configuration, CI, and releases are single-writer. Do not edit those files
in parallel with another agent.

## Claims

The product supports legal research. It is not legal advice, not hallucination-free, and
not a comprehensive citator. See `docs/LIMITATIONS.md`.
