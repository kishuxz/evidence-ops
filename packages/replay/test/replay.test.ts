import { OfflineIndex } from "@evidenceops/retrieve";
import { ResearchWorkflow } from "@evidenceops/workflow";
import { describe, expect, it } from "vitest";
import { compareRuns, earliestInvalidStep, replayAffectedBranch, toRegressionFixture } from "../src/index.js";

describe("failure attribution and replay", () => {
  it("attributes the earliest invalid step and replays from the last valid checkpoint", () => {
    const index = new OfflineIndex();
    index.add({
      id: "fixture.widget.v1",
      caption: "Widget Co. v. Sprocket Ltd.",
      text: "The filing deadline is jurisdictional.",
      jurisdiction: "US-FED",
      date: "2020-01-01",
      versionLocator: "v1",
    });
    const workflow = new ResearchWorkflow({ index, maxAttempts: 1 });
    const failed = workflow.run({
      idempotencyKey: "replay-1",
      tenantId: "ten_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      matterId: "mat_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      proposition: "The filing deadline is jurisdictional.",
      citationRaw: "999 U.S. 999 (2099)",
      pinpoint: "at 1",
      quotation: "The filing deadline is jurisdictional.",
      researchJurisdiction: "US-FED",
      citedDocumentId: "fixture.widget.v1",
    });
    expect(earliestInvalidStep(failed)).toBe("resolve");
    const { original, replay, earliest } = replayAffectedBranch(workflow, failed);
    expect(earliest).toBe("resolve");
    expect(original.status).toBe("dead_letter");
    expect(compareRuns(original, replay).sameStatus).toBe(true);
    const fixture = toRegressionFixture(original);
    expect(fixture.id).toContain("replay-1");
    expect(fixture.annotation.rationale).toContain("resolve");
  });
});
