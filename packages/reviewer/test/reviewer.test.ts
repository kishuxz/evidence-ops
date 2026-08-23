import { AuditLog } from "@evidenceops/auth";
import { describe, expect, it } from "vitest";
import { recordDecision, renderReviewer, type ReviewerView } from "../src/index.js";

const view: ReviewerView = {
  tenantId: "ten_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  matterId: "mat_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  propositionId: "prp_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  proposition: "The filing deadline is jurisdictional.",
  passage: "The filing deadline is jurisdictional.",
  quotation: "The filing deadline is jurisdictional.",
  verdict: "FULL_SUPPORT",
  reasonCodes: ["quotation_exact"],
  conflicts: [],
  unknowns: [],
  authorityVersions: [{ locator: "v1", text: "The filing deadline is jurisdictional." }],
  redline: { previous: "old", next: "new" },
};

describe("reviewer evidence view", () => {
  it("renders proposition and passage side by side with verdicts and actions", () => {
    const html = renderReviewer(view);
    expect(html).toContain("Proposition");
    expect(html).toContain("Passage");
    expect(html).toContain("FULL_SUPPORT");
    expect(html).toContain("data-action=\"accept\"");
    expect(html).toContain("data-action=\"reject\"");
    expect(html).toContain("data-action=\"request_research\"");
    expect(html).toContain("Redline");
  });

  it("records accept, reject, and request-research on an append-only audit log", () => {
    const log = new AuditLog();
    const principal = { userId: "usr_1", tenantId: view.tenantId, roles: ["reviewer" as const] };
    recordDecision(log, principal, view, "accept", "2026-08-22T00:00:00Z");
    recordDecision(log, principal, view, "reject", "2026-08-22T00:00:01Z");
    recordDecision(log, principal, view, "request_research", "2026-08-22T00:00:02Z");
    expect(log.list(view.tenantId).map((event) => event.action)).toEqual([
      "review.accept",
      "review.reject",
      "review.request_research",
    ]);
    expect(() => log.delete("aud_00000001")).toThrow(/append-only/);
  });
});
