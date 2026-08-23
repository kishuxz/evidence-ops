import { sampleSupportingGraph } from "@evidenceops/graph";
import { describe, expect, it } from "vitest";
import { SCOPED_STATEMENTS } from "../src/cypher.js";
import { hasNeo4jConfig, verifyNeo4jConformance } from "../src/index.js";

describe("Neo4j Cypher contract", () => {
  it("parameterizes tenant and matter on every scoped query", () => {
    for (const statement of SCOPED_STATEMENTS) {
      expect(statement, statement).toContain("$tenantId");
      expect(statement, statement).toContain("$matterId");
      expect(statement.toLowerCase()).not.toMatch(/'\s*ten_/);
      expect(statement).not.toMatch(/\$\{/);
    }
  });

  it("does not claim integration success without a live engine", async () => {
    if (!hasNeo4jConfig()) {
      const result = await verifyNeo4jConformance(
        (() => {
          const fixture = sampleSupportingGraph("neo4j-skip");
          return { scope: fixture.scope, graph: fixture.graph };
        })(),
      );
      expect(result.status).toBe("unverified");
      expect(result.failures).toEqual([]);
    }
  });
});

describe.skipIf(!hasNeo4jConfig())("Neo4j live adapter", () => {
  it("passes async adapter conformance against a real engine", async () => {
    const fixture = sampleSupportingGraph("neo4j-live");
    const result = await verifyNeo4jConformance({ scope: fixture.scope, graph: fixture.graph });
    expect(result.failures).toEqual([]);
    expect(result.status).toBe("verified");
  });
});
