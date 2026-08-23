# EvidenceOps CLI

`@evidenceops/cli` is a **locally packaged** executable. It is **not** published to npm
or PyPI. Installing a git-workspace tarball is not a public release (ADR 0024).

Binary name: `evidenceops`. Package name: `@evidenceops/cli`. Version `0.1.0` is a
workspace version, not a GitHub Release tag.

## Pack and install (unpublished)

From a clone of this repository, with Node 20.x and pnpm 10.14.0:

```bash
pnpm --filter @evidenceops/cli build
pnpm --filter @evidenceops/cli pack --pack-destination /tmp
mkdir /tmp/evidenceops-cli-consumer && cd /tmp/evidenceops-cli-consumer
npm init -y
npm install /tmp/evidenceops-cli-0.1.0.tgz
npx evidenceops --help
```

Do not run `npm publish`.

## Required flags

Every mutating or scoped command requires `--tenant`, `--matter`, and `--token`.
`--format json` is the automation mode. Default format is `human`. `--debug` prints
stack traces; they are omitted by default.

`--data-dir` selects the local workspace (default `.evidenceops` in the current
directory). Tokens are stored as SHA-256 hashes, never logged.

## Commands

```bash
evidenceops init --tenant T --matter M --token TOKEN --user USER --role tenant_admin
evidenceops ingest --tenant T --matter M --token TOKEN --ids fixture.widget.v1
evidenceops retrieve --tenant T --matter M --token TOKEN --text "..." --jurisdiction US-FED
evidenceops verify --tenant T --matter M --token TOKEN \
  --proposition "..." --quotation "..." --pinpoint "..." --citation "..."
evidenceops trace --tenant T --matter M --token TOKEN --start-id NODE_ID
evidenceops impact --tenant T --matter M --token TOKEN --version-id VERSION_ID
evidenceops review --tenant T --matter M --token TOKEN --proposition-id ID [--action accept]
evidenceops evaluate --tenant T --matter M --token TOKEN
evidenceops graph validate --tenant T --matter M --token TOKEN --file graph.json
```

`evaluate` runs the synthetic engineering corpus. It is not expert review and is not a
legal-reliability score.

## Exit codes

| Code | Name | Meaning |
| --- | --- | --- |
| 0 | OK | Command completed |
| 1 | USAGE | Invalid, missing, or malformed input |
| 2 | UNAUTHENTICATED | Missing or unknown token |
| 3 | FORBIDDEN | Cross-tenant, missing permission, or isolation violation |
| 4 | NOT_FOUND | Snapshot, graph node, or empty retrieval |
| 5 | PARTIAL | Partial ingestion or ambiguous retrieval |
| 6 | VALIDATION | Graph or payload failed validation |
| 7 | APPROVAL | Controlled action waiting on recorded approval |
| 8 | UNRESOLVED | Verification returned `UNRESOLVED` (not counted as success) |

Partial connector ingestion is never exit 0.

## Network

The CLI does not call CourtListener, RECAP, or any network API. Fixture snapshots are
not live court data.
