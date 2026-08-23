import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { repoPath } from "../src/repo.js";

function read(relative: string): string {
  return readFileSync(repoPath(relative), "utf8");
}

describe("repository hygiene", () => {
  it("ignores secrets, dependencies, and conductor context", () => {
    const gitignore = read(".gitignore");
    for (const pattern of [".env", "node_modules", ".venv", ".context", "__pycache__"]) {
      expect(gitignore).toContain(pattern);
    }
  });

  it("pins Node 20 and Python 3.12", () => {
    expect(read(".nvmrc").trim()).toBe("20");
    expect(read(".python-version").trim()).toBe("3.12");
    expect(read("package.json")).toContain(">=20 <21");
    expect(read("pyproject.toml")).toContain('requires-python = ">=3.12"');
  });

  it("provides an ADR template with required sections", () => {
    const template = read("docs/adr/0000-template.md");
    for (const heading of ["## Status", "## Context", "## Decision", "## Consequences"]) {
      expect(template).toContain(heading);
    }
  });

  it("runs the verification gate in CI", () => {
    const workflow = read(".github/workflows/ci.yml");
    expect(workflow).toContain("scripts/verify.sh");
    expect(workflow).toContain("node-version:");
    expect(workflow).toMatch(/['\"]20['\"]/);
    expect(workflow).toContain("python-version:");
    expect(workflow).toContain("3.12");
    expect(existsSync(repoPath("scripts/verify.sh"))).toBe(true);
  });

  it("includes work-node issue and pull request templates", () => {
    expect(existsSync(repoPath(".github/ISSUE_TEMPLATE/work-node.yml"))).toBe(true);
    expect(existsSync(repoPath(".github/PULL_REQUEST_TEMPLATE.md"))).toBe(true);
    const issue = read(".github/ISSUE_TEMPLATE/work-node.yml");
    expect(issue).toContain("Non-goals");
    expect(issue).toContain("Acceptance tests");
  });
});
