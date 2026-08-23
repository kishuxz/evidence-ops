# Retrieval and connector failure

## Symptom

Telemetry `retrievalFailures` or `connectorFailures` increases, or retrieve
checkpoints are `ok: false`.

## Immediate checks

1. Confirm the connector metadata still has `networkEnabled: false` and
   `liveCourtListener: false`.
2. Missing snapshots are `not_found` or `partial_ingestion`, never success.
3. Wrong-document risk on a hit must be passed into V1 as retrieved vs cited ids.

## Alerts

Log `error` with a correlation id. Do not invent an availability SLO; record the
count and investigate the fixture/index.

No live CourtListener lookup is an acceptable mitigation.
