import { ApprovalPolicy, type Principal } from "@evidenceops/auth";
import { resolveCitation, type AuthorityResolution } from "@evidenceops/authority";
import { FixtureConnector } from "@evidenceops/connector";
import { OfflineIndex, type RetrieveResult } from "@evidenceops/retrieve";
import { verifyProposition, type VerifyOutput } from "@evidenceops/verify";

export const WORKFLOW_VERSION = "research.offline.v1";
export const STEP_TOKEN_COST = 100;
export const STEP_USD_COST = 0.001;

export type StepName = "retrieve" | "resolve" | "verify" | "approval";

export type ResearchInput = {
  idempotencyKey: string;
  tenantId: string;
  matterId: string;
  proposition: string;
  citationRaw: string;
  pinpoint: string;
  quotation: string;
  researchJurisdiction: string;
  citedDocumentId?: string;
  publish?: boolean;
};

export type Checkpoint = {
  step: StepName;
  ok: boolean;
  at: string;
  output: unknown;
};

export type Budget = {
  maxTokens: number;
  usedTokens: number;
  maxCostUsd: number;
  usedCostUsd: number;
};

export type RunStatus = "completed" | "failed" | "dead_letter" | "awaiting_approval";

export type ResearchRun = {
  id: string;
  idempotencyKey: string;
  tenantId: string;
  matterId: string;
  input: ResearchInput;
  status: RunStatus;
  checkpoints: Checkpoint[];
  attempts: number;
  deadLetter: string | null;
  budget: Budget;
  error: string | null;
  retrieve: RetrieveResult | null;
  resolve: AuthorityResolution | null;
  verify: VerifyOutput | null;
  mode: "offline";
  workflowVersion: string;
};

export type WorkflowOptions = {
  index: OfflineIndex;
  connector?: FixtureConnector;
  approvals?: ApprovalPolicy;
  principal?: Principal;
  now?: () => string;
  timeoutMs?: number;
  maxAttempts?: number;
  maxTokens?: number;
  maxCostUsd?: number;
  sleepMs?: (ms: number) => void;
};

function charge(budget: Budget): string | null {
  budget.usedTokens += STEP_TOKEN_COST;
  budget.usedCostUsd = Number((budget.usedCostUsd + STEP_USD_COST).toFixed(6));
  if (budget.usedTokens > budget.maxTokens) {
    return "token_budget_exceeded";
  }
  if (budget.usedCostUsd > budget.maxCostUsd) {
    return "cost_budget_exceeded";
  }
  return null;
}

export class ResearchWorkflow {
  private readonly runs = new Map<string, ResearchRun>();
  private sequence = 0;
  private readonly index: OfflineIndex;
  private readonly connector: FixtureConnector;
  private readonly approvals: ApprovalPolicy;
  private readonly principal: Principal | undefined;
  private readonly now: () => string;
  private readonly timeoutMs: number;
  private readonly maxAttempts: number;
  private readonly maxTokens: number;
  private readonly maxCostUsd: number;

  constructor(options: WorkflowOptions) {
    this.index = options.index;
    this.connector = options.connector ?? new FixtureConnector();
    this.approvals = options.approvals ?? new ApprovalPolicy();
    this.principal = options.principal;
    this.now = options.now ?? (() => "2026-08-22T00:00:00Z");
    this.timeoutMs = options.timeoutMs ?? 5_000;
    this.maxAttempts = options.maxAttempts ?? 2;
    this.maxTokens = options.maxTokens ?? 10_000;
    this.maxCostUsd = options.maxCostUsd ?? 1;
  }

  get(idempotencyKey: string): ResearchRun | undefined {
    return this.runs.get(idempotencyKey);
  }

  run(input: ResearchInput, startedAt = Date.now()): ResearchRun {
    const existing = this.runs.get(input.idempotencyKey);
    if (existing && (existing.status === "completed" || existing.status === "awaiting_approval")) {
      return existing;
    }
    const run = existing
      ? { ...existing, attempts: existing.attempts + 1, checkpoints: [...existing.checkpoints] }
      : this.fresh(input);
    this.runs.set(input.idempotencyKey, run);

    try {
      if (Date.now() - startedAt > this.timeoutMs) {
        return this.fail(run, "timeout");
      }
      const retrieve = this.stepRetrieve(run, input);
      if (Date.now() - startedAt > this.timeoutMs) {
        return this.fail(run, "timeout");
      }
      const resolved = this.stepResolve(run, input);
      if (Date.now() - startedAt > this.timeoutMs) {
        return this.fail(run, "timeout");
      }
      this.stepVerify(run, input, retrieve, resolved);
      if (input.publish) {
        return this.stepApproval(run, input);
      }
      run.status = "completed";
      run.error = null;
      return run;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.retryOrDeadLetter(run, input, message, startedAt);
    }
  }

  retry(idempotencyKey: string): ResearchRun {
    const existing = this.runs.get(idempotencyKey);
    if (!existing) {
      throw new Error(`unknown run ${idempotencyKey}`);
    }
    const lastOk = [...existing.checkpoints].reverse().find((item) => item.ok);
    existing.checkpoints = lastOk
      ? existing.checkpoints.slice(0, existing.checkpoints.indexOf(lastOk) + 1)
      : [];
    existing.status = "failed";
    existing.deadLetter = null;
    existing.error = null;
    return this.run(existing.input);
  }

  private fresh(input: ResearchInput): ResearchRun {
    this.sequence += 1;
    return {
      id: `run_${String(this.sequence).padStart(8, "0")}`,
      idempotencyKey: input.idempotencyKey,
      tenantId: input.tenantId,
      matterId: input.matterId,
      input,
      status: "failed",
      checkpoints: [],
      attempts: 1,
      deadLetter: null,
      budget: {
        maxTokens: this.maxTokens,
        usedTokens: 0,
        maxCostUsd: this.maxCostUsd,
        usedCostUsd: 0,
      },
      error: null,
      retrieve: null,
      resolve: null,
      verify: null,
      mode: "offline",
      workflowVersion: WORKFLOW_VERSION,
    };
  }

  private checkpoint(run: ResearchRun, step: StepName, ok: boolean, output: unknown): void {
    run.checkpoints.push({ step, ok, at: this.now(), output });
  }

  private fail(run: ResearchRun, error: string): ResearchRun {
    run.status = "failed";
    run.error = error;
    return run;
  }

  private retryOrDeadLetter(run: ResearchRun, input: ResearchInput, message: string, startedAt: number): ResearchRun {
    run.error = message;
    if (run.attempts >= this.maxAttempts) {
      run.status = "dead_letter";
      run.deadLetter = message;
      return run;
    }
    return this.run(input, startedAt);
  }

  private stepRetrieve(run: ResearchRun, input: ResearchInput): RetrieveResult {
    if (run.retrieve && run.checkpoints.some((item) => item.step === "retrieve" && item.ok)) {
      return run.retrieve;
    }
    const over = charge(run.budget);
    if (over) {
      this.checkpoint(run, "retrieve", false, { error: over });
      throw new Error(over);
    }
    const retrieve = this.index.retrieve({
      text: `${input.proposition} ${input.citationRaw}`,
      jurisdiction: input.researchJurisdiction,
      ...(input.citedDocumentId ? { citedDocumentId: input.citedDocumentId } : {}),
    });
    run.retrieve = retrieve;
    this.checkpoint(run, "retrieve", true, retrieve.diagnostics);
    return retrieve;
  }

  private stepResolve(run: ResearchRun, input: ResearchInput): AuthorityResolution {
    if (run.resolve && run.checkpoints.some((item) => item.step === "resolve" && item.ok)) {
      return run.resolve;
    }
    const over = charge(run.budget);
    if (over) {
      this.checkpoint(run, "resolve", false, { error: over });
      throw new Error(over);
    }
    const resolved = resolveCitation(input.citationRaw, this.connector);
    run.resolve = resolved;
    this.checkpoint(run, "resolve", resolved.status === "resolved", resolved);
    if (resolved.status !== "resolved") {
      throw new Error("authority_not_found");
    }
    return resolved;
  }

  private stepVerify(
    run: ResearchRun,
    input: ResearchInput,
    retrieve: RetrieveResult,
    resolved: AuthorityResolution,
  ): VerifyOutput {
    const over = charge(run.budget);
    if (over) {
      this.checkpoint(run, "verify", false, { error: over });
      throw new Error(over);
    }
    const top = retrieve.hits[0];
    const snapshot = resolved.snapshot;
    if (!snapshot) {
      throw new Error("missing_snapshot");
    }
    const verify = verifyProposition({
      proposition: input.proposition,
      quotation: input.quotation,
      pinpoint: input.pinpoint,
      snapshotText: snapshot.text,
      researchJurisdiction: input.researchJurisdiction,
      authorityJurisdiction: input.researchJurisdiction,
      authorityResolved: resolved.status === "resolved",
      versionSuperseded: snapshot.text.includes("SUPERSEDED"),
      retrievedDocumentId: top?.id ?? null,
      citedDocumentId: input.citedDocumentId ?? snapshot.id,
    });
    run.verify = verify;
    this.checkpoint(run, "verify", true, verify);
    return verify;
  }

  private stepApproval(run: ResearchRun, input: ResearchInput): ResearchRun {
    const principal = this.principal;
    if (!principal) {
      this.checkpoint(run, "approval", false, { error: "missing_principal" });
      return this.fail(run, "missing_principal");
    }
    try {
      this.approvals.require(input.tenantId, input.matterId, "publish");
      this.checkpoint(run, "approval", true, { action: "publish" });
      run.status = "completed";
      run.error = null;
      return run;
    } catch {
      this.checkpoint(run, "approval", false, { error: "awaiting_approval" });
      run.status = "awaiting_approval";
      run.error = "publish requires a recorded human approval";
      return run;
    }
  }
}
