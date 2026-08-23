import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { repoPath } from "../src/repo.js";

const VERDICTS = [
  "FULL_SUPPORT",
  "PARTIAL_SUPPORT",
  "NO_SUPPORT",
  "CONTRADICTED",
  "WRONG_JURISDICTION",
  "STALE_AUTHORITY",
  "UNRESOLVED",
] as const;

function read(relative: string): string {
  return readFileSync(repoPath(relative), "utf8");
}

describe("claims and verdict contract", () => {
  it("documents all seven verdicts in the product spec and agents contract", () => {
    const spec = read("docs/PRODUCT_SPEC.md");
    const agents = read("AGENTS.md");
    for (const verdict of VERDICTS) {
      expect(spec, verdict).toContain(verdict);
      expect(agents, verdict).toContain(verdict);
    }
  });

  it("states that the product is research support, not legal advice or a citator", () => {
    const readme = read("README.md").toLowerCase();
    expect(readme).toContain("not legal advice");
    expect(readme).toContain("lawyer");
    expect(readme).toContain("hallucination-free");
    expect(readme).toContain("citator");
    expect(readme).toContain("not a substitute for legal judgment");
  });

  it("keeps an explicit limitations surface", () => {
    const limitations = read("docs/LIMITATIONS.md").toLowerCase();
    expect(limitations).toContain("does not provide legal advice");
    expect(limitations).toContain("not hallucination-free");
    expect(limitations).toContain("not a comprehensive citator");
    expect(limitations).toContain("graph path is provenance, not proof");
  });

  it("records Apache-2.0 after the human license decision", () => {
    const licenseStatus = read("docs/LICENSE_STATUS.md").toLowerCase();
    expect(licenseStatus).toContain("apache license, version 2.0");
    const license = read("LICENSE");
    expect(license).toContain("Apache License");
    expect(license).toContain("Version 2.0");
    expect(read("docs/adr/0008-courtlistener-blocked.md").toLowerCase()).toContain("blocked");
  });

  it("stops before Z2 and does not claim Provenance Guard or expert-reviewed cases", () => {
    const rc = read("docs/RELEASE_CANDIDATE.md").toLowerCase();
    expect(rc).toContain("stop before z2");
    expect(rc).toContain("authorization to publish packages");
    expect(rc).toContain("i1");
    expect(rc).toContain("engineering_fixture_awaiting_expert_review");
    expect(read("docs/EVALUATION_CORPUS.md").toLowerCase()).toContain("not");
    expect(read("docs/EVALUATION_CORPUS.md").toLowerCase()).toContain("expert-reviewed");
  });
});
