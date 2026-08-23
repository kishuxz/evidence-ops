import { describe, expect, it } from "vitest";
import { INITIAL_CASES, initialManifest } from "../src/fixtures.js";
import {
  CASE_CATEGORIES,
  CATEGORY_VERDICT,
  countByCategory,
  validateEvalCase,
} from "../src/schema.js";

describe("evaluation corpus", () => {
  it("validates every initial case and covers all categories", () => {
    for (const item of INITIAL_CASES) {
      expect(validateEvalCase(item).id).toBe(item.id);
    }
    const counts = countByCategory(INITIAL_CASES);
    for (const category of CASE_CATEGORIES) {
      expect(counts[category], category).toBeGreaterThan(0);
    }
  });

  it("records honest actual vs target counts", () => {
    const manifest = initialManifest();
    expect(manifest.notes.toLowerCase()).toContain("not a claim");
    const actualTotal = Object.values(manifest.actualCounts).reduce((sum, n) => sum + n, 0);
    const targetTotal = Object.values(manifest.targetCounts).reduce((sum, n) => sum + n, 0);
    expect(actualTotal).toBe(INITIAL_CASES.length);
    expect(actualTotal).toBeLessThan(targetTotal);
  });

  it("rejects privileged fixtures and mismatched hashes", () => {
    const base = INITIAL_CASES[0];
    if (!base) {
      throw new Error("missing case");
    }
    expect(() => validateEvalCase({ ...base, privileged: true })).toThrow(/privileged/);
    expect(() =>
      validateEvalCase({
        ...base,
        snapshot: { ...base.snapshot, contentHash: "a".repeat(64) },
      }),
    ).toThrow(/does not match/);
  });

  it("maps each category to the contracted verdict", () => {
    for (const item of INITIAL_CASES) {
      expect(item.expectedVerdict).toBe(CATEGORY_VERDICT[item.category]);
      expect(item.snapshot.notLiveCourtListener).toBe(true);
    }
  });
});
