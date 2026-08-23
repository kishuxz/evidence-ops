import { InMemoryGraphStore } from "./store.js";
import type { GraphStore, StoreScope } from "./adapter.js";
import { graphFromJson, graphFromJsonl, graphToCanonicalJson, graphToJsonl } from "./serialize.js";
import { validateGraph } from "./validate.js";
import type { EvidenceGraph } from "./types.js";

export type ConformanceFailure = {
  name: string;
  message: string;
};

export function runAdapterConformance(
  createStore: () => GraphStore,
  fixture: { scope: StoreScope; graph: EvidenceGraph },
): ConformanceFailure[] {
  const failures: ConformanceFailure[] = [];
  const check = (name: string, fn: () => void): void => {
    try {
      fn();
    } catch (error) {
      failures.push({ name, message: error instanceof Error ? error.message : String(error) });
    }
  };

  check("import validates", () => {
    const store = createStore();
    const result = store.importGraph(fixture.scope, fixture.graph);
    if (!result.ok) {
      throw new Error(result.issues.map((issue) => issue.code).join(","));
    }
  });

  check("rejects invalid import", () => {
    const store = createStore();
    const broken: EvidenceGraph = { schemaVersion: 1, nodes: [], edges: fixture.graph.edges };
    const result = store.importGraph(fixture.scope, broken);
    if (result.ok) {
      throw new Error("expected invalid graph to fail import");
    }
  });

  check("isolates tenants", () => {
    const store = createStore();
    store.importGraph(fixture.scope, fixture.graph);
    const other: StoreScope = { tenantId: "ten_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", matterId: fixture.scope.matterId };
    const leaked = store.getNode(other, fixture.graph.nodes[0]?.id ?? "");
    if (leaked) {
      throw new Error("cross-tenant getNode leaked");
    }
  });

  check("canonical json round trip", () => {
    const json = graphToCanonicalJson(fixture.graph);
    const parsed = graphFromJson(JSON.stringify(JSON.parse(json)));
    const again = graphToCanonicalJson(parsed);
    if (json !== again) {
      throw new Error("canonical json is not stable");
    }
    if (!validateGraph(parsed).ok) {
      throw new Error("round-tripped graph failed validation");
    }
  });

  check("jsonl round trip", () => {
    const lines = graphToJsonl(fixture.graph);
    const parsed = graphFromJsonl(lines);
    if (graphToJsonl(parsed) !== lines) {
      throw new Error("jsonl is not stable");
    }
  });

  check("traces are deterministic", () => {
    const store = createStore();
    store.importGraph(fixture.scope, fixture.graph);
    const memo = fixture.graph.nodes.find((node) => node.type === "Memo");
    const proposition = fixture.graph.nodes.find((node) => node.type === "LegalProposition");
    if (!memo || !proposition) {
      throw new Error("fixture missing memo or proposition");
    }
    const first = JSON.stringify(store.evidenceTrace(fixture.scope, memo.id));
    const second = JSON.stringify(store.evidenceTrace(fixture.scope, memo.id));
    if (first !== second) {
      throw new Error("evidence trace is not deterministic");
    }
    const replay = store.failureReplay(fixture.scope, proposition.id);
    if (replay.kind !== "replay") {
      throw new Error("replay kind");
    }
    const reviewer = store.reviewerTrace(fixture.scope, memo.id);
    if (reviewer.steps.length < 2) {
      throw new Error("reviewer trace too short");
    }
  });

  return failures;
}

export function inMemoryConformance(fixture: { scope: StoreScope; graph: EvidenceGraph }): ConformanceFailure[] {
  return runAdapterConformance(() => new InMemoryGraphStore(), fixture);
}
