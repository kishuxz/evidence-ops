import { ApprovalPolicy } from "@evidenceops/auth";
import { describe, expect, it } from "vitest";
import { OfflineIndex } from "@evidenceops/retrieve";
import { ResearchWorkflow } from "../src/engine.js";

function widgetIndex(): OfflineIndex {
  const index = new OfflineIndex();
  index.add({
    id: "fixture.widget.v1",
    caption: "Widget Co. v. Sprocket Ltd.",
    text: "Widget Co. v. Sprocket Ltd., 1 Fix. 1 (Fict. Cir. 2020)\nThe filing deadline is jurisdictional.",
    jurisdiction: "US-FED",
    date: "2020-01-01",
    versionLocator: "v1",
  });
  return index;
}

const baseInput = {
  idempotencyKey: "run-1",
  tenantId: "ten_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  matterId: "mat_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  proposition: "The filing deadline is jurisdictional.",
  citationRaw: "Widget Co. v. Sprocket Ltd., 1 Fix. 1 (Fict. Cir. 2020)",
  pinpoint: "1 Fix. at 3",
  quotation: "The filing deadline is jurisdictional.",
  researchJurisdiction: "US-FED",
  citedDocumentId: "fixture.widget.v1",
};

describe("ResearchWorkflow", () => {
  it("runs retrieve, resolve, and verify offline and is idempotent", () => {
    const workflow = new ResearchWorkflow({ index: widgetIndex() });
    const first = workflow.run(baseInput);
    const second = workflow.run(baseInput);
    expect(first.status).toBe("completed");
    expect(first.verify?.verdict).toBe("FULL_SUPPORT");
    expect(first.mode).toBe("offline");
    expect(second.id).toBe(first.id);
    expect(first.checkpoints.map((item) => item.step)).toEqual(["retrieve", "resolve", "verify"]);
  });

  it("treats unresolved authority as a failed run, not a partial success", () => {
    const workflow = new ResearchWorkflow({ index: widgetIndex(), maxAttempts: 1 });
    const result = workflow.run({ ...baseInput, idempotencyKey: "missing", citationRaw: "999 U.S. 999 (2099)" });
    expect(result.status).toBe("dead_letter");
    expect(result.verify).toBeNull();
    expect(result.deadLetter).toBe("authority_not_found");
    expect(result.checkpoints.some((item) => item.step === "retrieve" && item.ok)).toBe(true);
  });

  it("holds publish until a human approval is recorded", () => {
    const approvals = new ApprovalPolicy();
    const principal = {
      userId: "usr_1",
      tenantId: baseInput.tenantId,
      roles: ["reviewer" as const],
    };
    const workflow = new ResearchWorkflow({ index: widgetIndex(), approvals, principal });
    const waiting = workflow.run({ ...baseInput, idempotencyKey: "pub", publish: true });
    expect(waiting.status).toBe("awaiting_approval");
    approvals.record(principal, baseInput.matterId, "publish", "2026-08-22T00:00:00Z");
    const released = workflow.run({ ...baseInput, idempotencyKey: "pub-2", publish: true });
    expect(released.status).toBe("completed");
  });

  it("fails closed when the token budget is exhausted", () => {
    const workflow = new ResearchWorkflow({ index: widgetIndex(), maxTokens: 50, maxAttempts: 1 });
    const result = workflow.run({ ...baseInput, idempotencyKey: "budget" });
    expect(result.status).toBe("dead_letter");
    expect(result.error).toBe("token_budget_exceeded");
  });
});
