import { graphFromJson, graphFromJsonl, graphToCanonicalJson, graphToJsonl } from "./serialize.js";
import { validateGraph } from "./validate.js";
import type { EvidenceGraph, GraphNode, GraphValidation } from "./types.js";
import type { ExportOptions, GraphStore, StoreScope, Trace } from "./adapter.js";
import type { ConformanceFailure } from "./conformance.js";

export interface AsyncGraphStore {
  importGraph(scope: StoreScope, graph: EvidenceGraph): Promise<GraphValidation>;
  exportGraph(scope: StoreScope, options?: ExportOptions): Promise<EvidenceGraph>;
  getNode(scope: StoreScope, id: string): Promise<GraphNode | undefined>;
  evidenceTrace(scope: StoreScope, startId: string): Promise<Trace>;
  contradictionTrace(scope: StoreScope, propositionId: string): Promise<Trace>;
  changeImpact(scope: StoreScope, startId: string): Promise<Trace>;
  reviewerTrace(scope: StoreScope, memoId: string): Promise<Trace>;
  failureReplay(scope: StoreScope, propositionId: string): Promise<Trace>;
}

export function syncToAsync(store: GraphStore): AsyncGraphStore {
  return {
    importGraph: async (scope, graph) => store.importGraph(scope, graph),
    exportGraph: async (scope, options) => store.exportGraph(scope, options),
    getNode: async (scope, id) => store.getNode(scope, id),
    evidenceTrace: async (scope, startId) => store.evidenceTrace(scope, startId),
    contradictionTrace: async (scope, propositionId) => store.contradictionTrace(scope, propositionId),
    changeImpact: async (scope, startId) => store.changeImpact(scope, startId),
    reviewerTrace: async (scope, memoId) => store.reviewerTrace(scope, memoId),
    failureReplay: async (scope, propositionId) => store.failureReplay(scope, propositionId),
  };
}

export async function runAsyncAdapterConformance(
  createStore: () => AsyncGraphStore,
  fixture: { scope: StoreScope; graph: EvidenceGraph },
): Promise<ConformanceFailure[]> {
  const failures: ConformanceFailure[] = [];
  const check = async (name: string, fn: () => Promise<void>): Promise<void> => {
    try {
      await fn();
    } catch (error) {
      failures.push({ name, message: error instanceof Error ? error.message : String(error) });
    }
  };

  await check("import validates", async () => {
    const store = createStore();
    const result = await store.importGraph(fixture.scope, fixture.graph);
    if (!result.ok) {
      throw new Error(result.issues.map((issue) => issue.code).join(","));
    }
  });

  await check("rejects invalid import", async () => {
    const store = createStore();
    const broken: EvidenceGraph = { schemaVersion: 1, nodes: [], edges: fixture.graph.edges };
    const result = await store.importGraph(fixture.scope, broken);
    if (result.ok) {
      throw new Error("expected invalid graph to fail import");
    }
  });

  await check("isolates tenants", async () => {
    const store = createStore();
    await store.importGraph(fixture.scope, fixture.graph);
    const other: StoreScope = {
      tenantId: "ten_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      matterId: fixture.scope.matterId,
    };
    const leaked = await store.getNode(other, fixture.graph.nodes[0]?.id ?? "");
    if (leaked) {
      throw new Error("cross-tenant getNode leaked");
    }
  });

  await check("canonical json round trip", async () => {
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

  await check("jsonl round trip", async () => {
    const lines = graphToJsonl(fixture.graph);
    const parsed = graphFromJsonl(lines);
    if (graphToJsonl(parsed) !== lines) {
      throw new Error("jsonl is not stable");
    }
  });

  await check("traces are deterministic", async () => {
    const store = createStore();
    await store.importGraph(fixture.scope, fixture.graph);
    const memo = fixture.graph.nodes.find((node) => node.type === "Memo");
    const proposition = fixture.graph.nodes.find((node) => node.type === "LegalProposition");
    if (!memo || !proposition) {
      throw new Error("fixture missing memo or proposition");
    }
    const first = JSON.stringify(await store.evidenceTrace(fixture.scope, memo.id));
    const second = JSON.stringify(await store.evidenceTrace(fixture.scope, memo.id));
    if (first !== second) {
      throw new Error("evidence trace is not deterministic");
    }
    const replay = await store.failureReplay(fixture.scope, proposition.id);
    if (replay.kind !== "replay") {
      throw new Error("replay kind");
    }
    const reviewer = await store.reviewerTrace(fixture.scope, memo.id);
    if (reviewer.steps.length < 2) {
      throw new Error("reviewer trace too short");
    }
  });

  return failures;
}
