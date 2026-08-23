# Neo4j adapter (G3)

The optional adapter lives in `@evidenceops/graph-neo4j`. Core verification does
**not** require Neo4j, Docker, network, or credentials.

## Status

| Environment | How it is determined | Status |
| --- | --- | --- |
| Default CI / clean clone | `NEO4J_URI` unset | `unverified` (tests skip live suite) |
| Live engine | `NEO4J_URI` set and `runAsyncAdapterConformance` returns no failures | `verified` |

Do not treat skipped tests or driver unit tests as Neo4j integration success.

## Last local verification

- Date: 2026-08-22
- Engine: Neo4j 5.26.29 (`neo4j:5-community` container, Bolt `127.0.0.1:7687`)
- Result: `pnpm --filter @evidenceops/graph-neo4j test` with `NEO4J_URI` set —
  `runAsyncAdapterConformance` passed
- Core CI: remains `unverified` (live suite skipped when `NEO4J_URI` is unset)

## Local engine

```bash
docker run --rm -d --name evidenceops-neo4j \
  -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/evidenceops_test_pw \
  neo4j:5-community

export NEO4J_URI=bolt://127.0.0.1:7687
export NEO4J_USER=neo4j
export NEO4J_PASSWORD=evidenceops_test_pw
pnpm --filter @evidenceops/graph-neo4j test
```

The password above is a local test secret, not a production credential. Do not
commit real credentials or a `.env` file.
