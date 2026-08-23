import { stableId } from "@evidenceops/contracts";
import { describe, expect, it } from "vitest";
import { InMemoryGraphStore } from "../src/store.js";
import { graphFromJsonl, graphToCanonicalJson, graphToJsonl } from "../src/serialize.js";
import { inMemoryConformance } from "../src/conformance.js";
import { envelope, makeEdge, sampleSupportingGraph } from "./fixtures.js";

describe("in-memory store", () => {
  it("imports a valid graph and hides it from another tenant", () => {
    const fixture = sampleSupportingGraph("acme");
    const other = sampleSupportingGraph("other");
    const store = new InMemoryGraphStore();
    expect(store.importGraph(fixture.scope, fixture.graph).ok).toBe(true);
    expect(store.importGraph(other.scope, other.graph).ok).toBe(true);
    expect(store.getNode(fixture.scope, fixture.memo)?.id).toBe(fixture.memo);
    expect(store.getNode(other.scope, fixture.memo)).toBeUndefined();
    expect(store.exportGraph(other.scope, { redact: false }).nodes.some((node) => node.id === fixture.memo)).toBe(
      false,
    );
  });

  it("rejects invalid graphs on import", () => {
    const fixture = sampleSupportingGraph();
    const store = new InMemoryGraphStore();
    const result = store.importGraph(fixture.scope, { schemaVersion: 1, nodes: [], edges: fixture.graph.edges });
    expect(result.ok).toBe(false);
    expect(store.exportGraph(fixture.scope, { redact: false }).nodes).toEqual([]);
  });

  it("refuses to replace an immutable snapshot", () => {
    const fixture = sampleSupportingGraph();
    const store = new InMemoryGraphStore();
    expect(store.importGraph(fixture.scope, fixture.graph).ok).toBe(true);
    const passage = fixture.graph.nodes.find((node) => node.type === "Passage");
    if (!passage) {
      throw new Error("missing passage");
    }
    passage.contentHash = "e".repeat(64);
    const result = store.importGraph(fixture.scope, fixture.graph);
    expect(result.issues.some((issue) => issue.code === "immutable_snapshot")).toBe(true);
  });

  it("round-trips canonical JSON and JSONL", () => {
    const fixture = sampleSupportingGraph();
    const json = graphToCanonicalJson(fixture.graph);
    expect(json).toBe(graphToCanonicalJson(JSON.parse(json)));
    const jsonl = graphToJsonl(fixture.graph);
    expect(graphToJsonl(graphFromJsonl(jsonl))).toBe(jsonl);
  });

  it("walks evidence, reviewer, impact, contradiction, and replay traces deterministically", () => {
    const fixture = sampleSupportingGraph();
    fixture.graph.edges.push(
      makeEdge("CONTRADICTS", fixture.proposition, fixture.authority, {
        tenantId: fixture.tenant,
        matterId: fixture.matter,
      }),
      makeEdge("INVALIDATES", fixture.version, fixture.proposition, {
        tenantId: fixture.tenant,
        matterId: fixture.matter,
        impactKind: "direct",
      }),
      makeEdge("INVALIDATES", fixture.version, fixture.memo, {
        tenantId: fixture.tenant,
        matterId: fixture.matter,
        impactKind: "transitive",
      }),
    );
    const store = new InMemoryGraphStore();
    expect(store.importGraph(fixture.scope, fixture.graph).ok).toBe(true);
    const evidence = store.evidenceTrace(fixture.scope, fixture.conclusion);
    expect(evidence.steps.map((step) => step.nodeId)).toEqual(
      store.evidenceTrace(fixture.scope, fixture.conclusion).steps.map((step) => step.nodeId),
    );
    expect(evidence.steps.some((step) => step.type === "Passage")).toBe(true);
    expect(evidence.steps.some((step) => step.type === "AuthorityVersion")).toBe(true);
    const impact = store.changeImpact(fixture.scope, fixture.version);
    const kinds = impact.steps.map((step) => step.impactKind);
    const firstTransitive = kinds.findIndex((kind) => kind === "transitive");
    const lastDirect = kinds.lastIndexOf("direct");
    expect(lastDirect).toBeGreaterThanOrEqual(0);
    expect(firstTransitive).toBeGreaterThan(lastDirect);
    expect(store.contradictionTrace(fixture.scope, fixture.proposition).steps.some((step) => step.via === "CONTRADICTS")).toBe(
      true,
    );
    expect(store.reviewerTrace(fixture.scope, fixture.memo).steps.some((step) => step.type === "ReviewerDecision")).toBe(
      true,
    );
    expect(store.failureReplay(fixture.scope, fixture.proposition).steps.some((step) => step.type === "Retrieval")).toBe(
      true,
    );
  });

  it("redacts confidential nodes on export by default", () => {
    const fixture = sampleSupportingGraph();
    const factId = stableId("ClientFact", { matterId: fixture.matter, slug: "hidden" });
    fixture.graph.nodes.push(
      envelope("ClientFact", factId, {
        tenantId: fixture.tenant,
        matterId: fixture.matter,
        redaction: "confidential",
        sourceLocator: "secret://x",
        attributes: { text: "client secret" },
      }),
    );
    const store = new InMemoryGraphStore();
    expect(store.importGraph(fixture.scope, fixture.graph).ok).toBe(true);
    const exported = store.exportGraph(fixture.scope);
    const node = exported.nodes.find((item) => item.id === factId);
    expect(node?.sourceLocator).toBeNull();
    expect(node?.attributes).toEqual({ redacted: true });
  });

  it("passes the in-memory adapter conformance suite", () => {
    const fixture = sampleSupportingGraph("conformance");
    const failures = inMemoryConformance({ scope: fixture.scope, graph: fixture.graph });
    expect(failures).toEqual([]);
  });
});
