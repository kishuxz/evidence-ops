import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseExecutionGraph } from "../src/graph.js";
import { repoPath } from "../src/repo.js";

const EXPECTED_IDS = [
  "F0",
  "S1",
  "G1",
  "E1",
  "D1",
  "R1",
  "X1",
  "V1",
  "G2",
  "G3",
  "W1",
  "M1",
  "P1",
  "A1",
  "U1",
  "O1",
  "I1",
  "Q1",
  "Z1",
  "Z2",
] as const;

describe("execution graph and progress tracker", () => {
  it("parses every work node from AUTONOMOUS_EXECUTION.md", () => {
    const markdown = readFileSync(repoPath("docs/AUTONOMOUS_EXECUTION.md"), "utf8");
    const nodes = parseExecutionGraph(markdown);
    expect(nodes.map((node) => node.id)).toEqual([...EXPECTED_IDS]);
    const f0 = nodes.find((node) => node.id === "F0");
    expect(f0?.dependsOn).toEqual([]);
    const s1 = nodes.find((node) => node.id === "S1");
    expect(s1?.dependsOn).toEqual(["F0"]);
    const v1 = nodes.find((node) => node.id === "V1");
    expect(v1?.dependsOn).toEqual(["R1", "E1"]);
  });

  it("keeps PROGRESS.md aligned with the execution graph", () => {
    const execution = parseExecutionGraph(
      readFileSync(repoPath("docs/AUTONOMOUS_EXECUTION.md"), "utf8"),
    );
    const progress = parseExecutionGraph(readFileSync(repoPath("docs/PROGRESS.md"), "utf8"));
    expect(progress.map((node) => node.id)).toEqual(execution.map((node) => node.id));
    for (const node of execution) {
      const tracked = progress.find((item) => item.id === node.id);
      expect(tracked, node.id).toBeDefined();
      expect(tracked?.dependsOn, node.id).toEqual(node.dependsOn);
    }
  });

  it("records F0 as merged against issue 1 and keeps a current in_progress node", () => {
    const progress = readFileSync(repoPath("docs/PROGRESS.md"), "utf8");
    expect(progress).toMatch(/\|\s*F0\s*\|.+\|\s*merged\s*\|/);
    expect(progress).toContain("#1");
    expect(progress).toMatch(/in_progress/);
  });
});
