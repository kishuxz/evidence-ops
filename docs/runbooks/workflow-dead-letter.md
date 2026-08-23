# Workflow dead letter

## Symptom

A research run status is `dead_letter`. Reviewers must not treat checkpoints as a
completed memo.

## Immediate checks

1. Read the run `error` and last failed checkpoint step.
2. Confirm tenant/matter on the run matches the reviewer scope.
3. If the step is `resolve`, the citation is unknown in the fixture index — do
   not call CourtListener.
4. If the step is budget/timeout, do not raise limits silently to force a pass.

## Replay

Use `@evidenceops/replay` to restore the last valid checkpoint and rerun the
affected branch. Convert confirmed failures into eval regression fixtures.

No SLO is defined. Measure latency and dead-letter counts first (O1 baseline).
