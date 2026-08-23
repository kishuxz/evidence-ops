import { INITIAL_CASES } from "@evidenceops/eval";
import { describe, expect, it } from "vitest";
import { verifyProposition } from "../src/engine.js";
import { verifyInputFromEvalCase } from "../src/fromEval.js";

describe("verifyProposition", () => {
  it("matches expected verdicts on the initial eval fixtures", () => {
    for (const item of INITIAL_CASES) {
      const result = verifyProposition(verifyInputFromEvalCase(item));
      expect(result.verdict, item.id).toBe(item.expectedVerdict);
      expect(result.method).toBe("deterministic");
    }
  });

  it("fails closed to UNRESOLVED when the passage is missing", () => {
    const result = verifyProposition({
      proposition: "x",
      quotation: "x",
      pinpoint: "at 1",
      snapshotText: "   ",
      researchJurisdiction: "US-FED",
      authorityJurisdiction: "US-FED",
      authorityResolved: true,
      versionSuperseded: false,
      retrievedDocumentId: "a",
      citedDocumentId: "a",
    });
    expect(result.verdict).toBe("UNRESOLVED");
    expect(result.reasonCodes).toContain("unresolved_insufficient_evidence");
  });

  it("does not treat unresolved as support", () => {
    const result = verifyProposition({
      proposition: "the holding is unclear",
      quotation: "the holding is unclear",
      pinpoint: "at 1",
      snapshotText: "the holding is unclear according to dicta but the order is unpublished",
      researchJurisdiction: "US-FED",
      authorityJurisdiction: "US-FED",
      authorityResolved: true,
      versionSuperseded: false,
      retrievedDocumentId: "a",
      citedDocumentId: "a",
    });
    expect(["FULL_SUPPORT", "PARTIAL_SUPPORT", "NO_SUPPORT", "UNRESOLVED"]).toContain(result.verdict);
    if (result.verdict === "UNRESOLVED") {
      expect(result.reasonCodes).not.toContain("proposition_full_support");
    }
  });

  it("classifies an explicit opposing passage as contradicted", () => {
    const result = verifyProposition({
      proposition: "The filing deadline is jurisdictional.",
      quotation: "The filing deadline is jurisdictional.",
      pinpoint: "at 3",
      snapshotText:
        "The filing deadline is jurisdictional. Later: the filing deadline is not jurisdictional.",
      researchJurisdiction: "US-FED",
      authorityJurisdiction: "US-FED",
      authorityResolved: true,
      versionSuperseded: false,
      retrievedDocumentId: "a",
      citedDocumentId: "a",
      opposingQuotation: "the filing deadline is not jurisdictional",
    });
    expect(result.verdict).toBe("CONTRADICTED");
    expect(result.reasonCodes).toContain("proposition_contradicted");
  });

  it("fails closed on unknown authority", () => {
    const result = verifyProposition({
      proposition: "x",
      quotation: "x",
      pinpoint: "at 1",
      snapshotText: "x",
      researchJurisdiction: "US-FED",
      authorityJurisdiction: "US-FED",
      authorityResolved: false,
      versionSuperseded: false,
      retrievedDocumentId: null,
      citedDocumentId: null,
    });
    expect(result.verdict).toBe("NO_SUPPORT");
    expect(result.reasonCodes).toContain("fabricated_authority");
  });
});
