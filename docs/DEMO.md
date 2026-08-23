# Local private demo

`@evidenceops/demo` is a **127.0.0.1** fixture-only walkthrough. It is not a public
host, not a production multi-tenant service, and not CourtListener.

## One command

```bash
bash scripts/demo.sh start
bash scripts/demo.sh script
bash scripts/demo.sh stop
```

Reset (demo namespace only):

```bash
bash scripts/demo.sh reset
```

Reset without `confirm=demo-data-only` is rejected. Other tenants in the data directory
are not deleted.

## Seed

Deterministic synthetic tenant/matter from `sampleSupportingGraph("demo")`. Tokens are
local demo secrets, not production credentials. No privileged or client data.

## Five-minute founder path

See `docs/FOUNDER_DEMO.md`. Record output locally if needed; do not publish a hosted demo.
