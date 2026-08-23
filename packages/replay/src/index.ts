import { INITIAL_CASES, type EvalCase } from "@evidenceops/eval";
import { type ResearchRun, type ResearchWorkflow, type StepName } from "@evidenceops/workflow";

const ORDER: StepName[] = ["retrieve", "resolve", "verify", "approval"];

export function earliestInvalidStep(run: ResearchRun): StepName | null {
  for (const step of ORDER) {
    const checkpoints = run.checkpoints.filter((item) => item.step === step);
    if (checkpoints.some((item) => !item.ok)) {
      return step;
    }
    if (checkpoints.length === 0 && run.status !== "completed") {
      return step;
    }
  }
  return null;
}

export function restoreLastValidCheckpoint(run: ResearchRun): ResearchRun {
  const lastOk = [...run.checkpoints].reverse().find((item) => item.ok);
  return {
    ...run,
    checkpoints: lastOk ? run.checkpoints.slice(0, run.checkpoints.indexOf(lastOk) + 1) : [],
    status: "failed",
    deadLetter: null,
    error: null,
  };
}

export function replayAffectedBranch(
  workflow: ResearchWorkflow,
  run: ResearchRun,
): { original: ResearchRun; replay: ResearchRun; earliest: StepName | null } {
  const earliest = earliestInvalidStep(run);
  const original: ResearchRun = {
    ...run,
    checkpoints: run.checkpoints.map((item) => ({ ...item })),
    budget: { ...run.budget },
  };
  restoreLastValidCheckpoint(run);
  const replay = workflow.retry(run.idempotencyKey);
  return { original, replay, earliest };
}

export function compareRuns(original: ResearchRun, replay: ResearchRun): { sameVerdict: boolean; sameStatus: boolean } {
  return {
    sameStatus: original.status === replay.status,
    sameVerdict: original.verify?.verdict === replay.verify?.verdict,
  };
}

export function toRegressionFixture(run: ResearchRun): EvalCase {
  const seed = INITIAL_CASES[0];
  if (!seed) {
    throw new Error("eval corpus missing seed fixture");
  }
  return {
    ...seed,
    id: `eval.regression.${run.idempotencyKey}`,
    proposition: run.input.proposition,
    citation: {
      raw: run.input.citationRaw,
      pinpoint: run.input.pinpoint,
      quotation: run.input.quotation,
    },
    annotation: {
      ...seed.annotation,
      rationale: `Regression fixture from failed run ${run.id}; earliest step ${earliestInvalidStep(run) ?? "none"}.`,
    },
  };
}
