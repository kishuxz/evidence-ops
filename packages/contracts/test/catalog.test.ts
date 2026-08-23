import { describe, expect, it } from "vitest";
import { loadCatalog } from "../src/catalog.js";
import { graphEdgeNames, graphNodeNames } from "./specNames.js";

describe("contract catalog", () => {
  it("lists every graph node from LEGAL_EVIDENCE_GRAPH.md", () => {
    const catalog = loadCatalog();
    expect(catalog.nodeTypes.map((item) => item.name).sort()).toEqual([...graphNodeNames()].sort());
  });

  it("lists every graph relationship from LEGAL_EVIDENCE_GRAPH.md", () => {
    const catalog = loadCatalog();
    expect([...catalog.edgeTypes].sort()).toEqual([...graphEdgeNames()].sort());
  });

  it("keeps all seven verdicts and explicit unknown data states", () => {
    const catalog = loadCatalog();
    expect(catalog.verdicts).toEqual([
      "FULL_SUPPORT",
      "PARTIAL_SUPPORT",
      "NO_SUPPORT",
      "CONTRADICTED",
      "WRONG_JURISDICTION",
      "STALE_AUTHORITY",
      "UNRESOLVED",
    ]);
    expect(catalog.dataAvailability).toEqual([
      "available",
      "missing_connector_data",
      "unavailable_treatment",
      "deleted_source",
    ]);
  });

  it("uses unique prefixes", () => {
    const prefixes = loadCatalog().nodeTypes.map((item) => item.prefix);
    expect(new Set(prefixes).size).toBe(prefixes.length);
  });
});
