import { describe, expect, it } from "vitest";
import { parseExecutionGraph } from "../src/graph.js";

describe("parseExecutionGraph", () => {
  it("parses dependency lists and treats em-dash as none", () => {
    const markdown = `
| ID | Work | Depends on | Mode |
| --- | --- | --- | --- |
| F0 | Foundation | — | single writer |
| V1 | Verify | R1, E1 | single writer |
`;
    const nodes = parseExecutionGraph(markdown);
    expect(nodes).toEqual([
      { id: "F0", work: "Foundation", dependsOn: [], mode: "single writer" },
      { id: "V1", work: "Verify", dependsOn: ["R1", "E1"], mode: "single writer" },
    ]);
  });

  it("ignores non-node table rows", () => {
    const markdown = "| Not an ID | skip |\n| Z2 | Release | Z1 | single writer |";
    expect(parseExecutionGraph(markdown).map((node) => node.id)).toEqual(["Z2"]);
  });
});
