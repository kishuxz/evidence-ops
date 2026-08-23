import { CORPUS } from "@evidenceops/eval";
import { describe, expect, it } from "vitest";
import {
  buildReviewPackage,
  cohensKappa,
  importCompletedReviews,
  verifyManifest,
} from "../src/index.js";

describe("expert-reviewer package", () => {
  it("blinds expected labels and keeps cases awaiting expert review", () => {
    const pkg = buildReviewPackage();
    expect(pkg.cases).toHaveLength(200);
    expect(verifyManifest(pkg)).toBe(true);
    expect(pkg.manifest.notes.toLowerCase()).toContain("not completed expert review");
    for (const item of pkg.cases) {
      expect(item.origin).toBe("synthetic");
      expect(item.sourceKind).toBe("constructed");
      expect(item.independentReview).toBe(false);
      expect(item.reviewStatus).toBe("engineering_fixture_awaiting_expert_review");
      expect(item.expectedVerdictBlinded).toMatch(/^[a-f0-9]{64}$/);
      const original = CORPUS.find((row) => row.id === item.id);
      expect(item.expectedVerdictBlinded).not.toBe(original?.expectedVerdict);
    }
  });

  it("imports completed reviews without flipping corpus labels", () => {
    const pkg = buildReviewPackage(CORPUS.slice(0, 2));
    const identities = [
      {
        reviewerId: "r1",
        fullName: "Reviewer One",
        qualifications: "fictitious bar, synthetic cases only",
        barAdmission: null,
        jurisdictionExpertise: ["US-FED"],
        independent: true,
      },
    ];
    const imported = importCompletedReviews(pkg, identities, [
      { caseId: pkg.cases[0]?.id ?? "", verdict: "FULL_SUPPORT", rationale: "passage matches", reviewerId: "r1" },
      { caseId: pkg.cases[1]?.id ?? "", verdict: "NO_SUPPORT", rationale: "does not match", reviewerId: "r1" },
    ]);
    expect(imported.independentReviewRemainsFalse).toBe(true);
    expect(imported.originRemainsSynthetic).toBe(true);
    expect(CORPUS[0]?.independentReview).toBe(false);
    expect(CORPUS[0]?.reviewStatus).toBe("engineering_fixture_awaiting_expert_review");
  });

  it("rejects unsigned or unqualified imports and records disagreements", () => {
    const pkg = buildReviewPackage(CORPUS.slice(0, 1));
    pkg.manifest.signature = "deadbeef";
    expect(() =>
      importCompletedReviews(
        pkg,
        [
          {
            reviewerId: "r1",
            fullName: "x",
            qualifications: "q",
            barAdmission: null,
            jurisdictionExpertise: [],
            independent: true,
          },
        ],
        [{ caseId: pkg.cases[0]?.id ?? "", verdict: "FULL_SUPPORT", rationale: "x", reviewerId: "r1" }],
      ),
    ).toThrow(/signature/);
    const fresh = buildReviewPackage(CORPUS.slice(0, 1));
    const id = fresh.cases[0]?.id ?? "";
    const agreement = cohensKappa(
      [{ caseId: id, verdict: "FULL_SUPPORT", rationale: "a", reviewerId: "r1" }],
      [{ caseId: id, verdict: "NO_SUPPORT", rationale: "b", reviewerId: "r2" }],
    );
    expect(agreement.disagreements).toHaveLength(1);
    expect(agreement.kappa).toBeLessThan(1);
  });
});
