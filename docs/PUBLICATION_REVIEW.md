# Publication review

This note records the review performed before changing `kishuxz/evidence-ops`
from private to public.

## Candidate rationale

EvidenceOps is a strong public candidate because it is an original,
personally owned project showing a production-shaped approach to legal AI
reliability: temporal evidence graphs, deterministic citation and proposition
verification, reviewer workflows, monitoring/impact analysis, offline
evaluation, RBAC/approval boundaries, telemetry, and explicit claims control.

Public visibility is source-code visibility only. It does not authorize
package publication, a public hosted demo, live CourtListener/RECAP access, or
use with privileged/client data.

## Historical gitleaks findings

Full-history `gitleaks` initially reported two `curl-auth-header` findings in
`scripts/demo.sh`, both on the demo reset command. The matched value is not
printed here.

Classification without exposing the value:

- both findings are the same local demo reset header in the same file;
- the value is 21 characters;
- it contains demo/local/only-style placeholder words;
- it has no known live-token prefix such as GitHub, OpenAI, Stripe, Slack,
  AWS, Google, JWT, or similar provider formats;
- it contains no shell expansion and no externally supplied credential;
- it is scoped to a `127.0.0.1` fixture-only demo reset path.

Decision: demonstrably inert local fixture. The two exact gitleaks
fingerprints are narrowly recorded in `.gitleaksignore`. No history rewrite or
credential rotation is required for this finding.

## Safety checks

Run before publication:

- `gitleaks git --no-banner --redact=100 --log-opts='--all' .`
- current-tree sensitive-pattern scan for credential and connection-string
  shapes;
- all-ref path scan for env, credentials, private data, datasets, archives,
  transcripts, and legal-source artifacts;
- all-ref large-blob scan for blobs over 256 KB;
- Git LFS and submodule inspection;
- contributor and collaborator review;
- license and claims-control review.

Findings:

- No LFS objects.
- No submodules.
- No tracked blob over 256 KB in any ref.
- No credential values found in the current tree.
- Suspicious historical paths were documentation about the blocked
  CourtListener/live-demo posture, not data artifacts.
- Contributors were Kishore-owned identities only.
- License is Apache-2.0; package metadata now records that license.

## Verification

Local verification was run on macOS with Node 20.20.2, pnpm 10.14.0, and
Python 3.14.3:

```bash
bash scripts/verify.sh
```

Result: `verify: ok`.

Notable gate output:

- TypeScript typecheck passed across the workspace packages.
- Vitest package suites passed, including auth, contracts, foundation, graph,
  graph-neo4j, workflow, bench, CLI pack/install/run, demo, replay, and
  robustness suites.
- Optional Neo4j live test was skipped because no `NEO4J_URI` was configured;
  this matches the repository's documented offline verification path.
- Python pytest: 11 passed.
- Ruff: all checks passed.
- Full-history gitleaks after the narrow fixture allowlist: no leaks found.

## Remaining limitations

- Not legal advice, not a lawyer, and not a substitute for attorney review.
- Not hallucination-free and not a comprehensive citator.
- The 200-case corpus is synthetic engineering fixtures awaiting expert
  review.
- The live CourtListener/RECAP adapter remains blocked by ADR 0008.
- The Provenance Guard integration remains blocked until a stable versioned
  release/interface exists.
- The local demo binds to `127.0.0.1`; there is no public hosted demo.
- Registry package publication remains unauthorized.
