import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { INITIAL_CASES } from "@evidenceops/eval";
import { describe, expect, it } from "vitest";
import { renderBaselineMarkdown, runAllBaselines } from "../src/index.js";

describe("Q1 baselines", () => {
  it("reports confusion without counting UNRESOLVED as correct and skips Provenance Guard", () => {
    const reports = runAllBaselines();
    expect(reports.map((item) => item.baseline)).toEqual([
      "model_only",
      "vector_rag",
      "hybrid_citations",
      "evidenceops",
    ]);
    for (const report of reports) {
      expect(report.unresolvedCountedAsCorrect).toBe(false);
      expect(report.provenanceGuard).toBe("unavailable");
      expect(report.total).toBe(200);
      expect(report.correct + report.unresolved).toBeLessThanOrEqual(report.total);
    }
    const evidenceops = reports.find((item) => item.baseline === "evidenceops");
    expect(evidenceops?.unresolved).toBe(0);
    expect(evidenceops?.correct).toBe(200);
    const reportPath = join(dirname(fileURLToPath(import.meta.url)), "../../../docs/Q1_BASELINE_REPORT.md");
    writeFileSync(reportPath, renderBaselineMarkdown(reports));
  });

  it("keeps EvidenceOps exact on the eight foundation fixtures", () => {
    const reports = runAllBaselines(INITIAL_CASES);
    const evidenceops = reports.find((item) => item.baseline === "evidenceops");
    expect(evidenceops?.correct).toBe(8);
  });
});
