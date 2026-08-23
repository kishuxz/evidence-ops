import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { repoPath } from "../src/repo.js";

const REQUIRED_DOCS = [
  "AGENTS.md",
  "CLAUDE.md",
  "README.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "docs/PRODUCT_SPEC.md",
  "docs/ARCHITECTURE.md",
  "docs/LEGAL_EVIDENCE_GRAPH.md",
  "docs/EVALUATION_PLAN.md",
  "docs/AUTONOMOUS_EXECUTION.md",
  "docs/CONDUCTOR_LAUNCH.md",
  "docs/PROGRESS.md",
  "docs/LIMITATIONS.md",
  "docs/LICENSE_STATUS.md",
  "docs/adr/README.md",
  "docs/adr/0000-template.md",
  "docs/research/courtlistener-terms.md",
  "docs/adr/0007-apache-2.0.md",
  "docs/adr/0008-courtlistener-blocked.md",
  "LICENSE",
] as const;

describe("required documentation", () => {
  it("keeps every canonical specification file in the repository", () => {
    const missing = REQUIRED_DOCS.filter((relative) => !existsSync(repoPath(relative)));
    expect(missing).toEqual([]);
  });

  it("lists documentation from README", () => {
    const readme = readFileSync(repoPath("README.md"), "utf8");
    for (const relative of [
      "docs/PRODUCT_SPEC.md",
      "docs/ARCHITECTURE.md",
      "docs/LEGAL_EVIDENCE_GRAPH.md",
      "docs/EVALUATION_PLAN.md",
      "docs/AUTONOMOUS_EXECUTION.md",
      "docs/CONDUCTOR_LAUNCH.md",
    ]) {
      expect(readme).toContain(relative);
    }
  });
});
