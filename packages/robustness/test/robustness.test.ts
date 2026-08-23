import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runRobustness, writeRobustnessReport } from "../src/index.js";

const reportPath = join(dirname(fileURLToPath(import.meta.url)), "../../../docs/Q2_ROBUSTNESS_REPORT.md");

describe("Q2 robustness", () => {
  it("does not count UNRESOLVED as correct and does not claim legal reliability", () => {
    mkdirSync(dirname(reportPath), { recursive: true });
    const report = runRobustness();
    writeRobustnessReport(reportPath, report);
    expect(report.legalReliabilityClaim).toBe(false);
    expect(report.hallucinationFreeClaim).toBe(false);
    expect(report.productionAccuracyClaim).toBe(false);
    expect(report.unresolvedCountedAsCorrect).toBe(false);
    expect(report.provenanceGuard).toBe("unavailable");
    const abstention = report.kinds.find((item) => item.kind === "abstention");
    expect(abstention?.unresolved).toBeGreaterThan(0);
    expect(abstention?.correct).toBe(0);
    const injection = report.kinds.find((item) => item.kind === "prompt_injection");
    expect(injection?.correct).toBeGreaterThan(0);
    const tenant = report.kinds.find((item) => item.kind === "cross_tenant");
    expect(tenant?.isolationFailures).toBe(0);
  });
});
