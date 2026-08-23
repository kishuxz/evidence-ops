import neo4j, { type Driver, type Session } from "neo4j-driver";
import {
  InMemoryGraphStore,
  redactGraph,
  runAsyncAdapterConformance,
  type AsyncGraphStore,
  type EvidenceGraph,
  type ExportOptions,
  type GraphNode,
  type GraphValidation,
  type StoreScope,
  type Trace,
} from "@evidenceops/graph";
import {
  CONSTRAINTS,
  DELETE_SCOPE_EDGES,
  DELETE_SCOPE_NODES,
  INDEXES,
  LOAD_EDGES,
  LOAD_NODE,
  LOAD_NODES,
  UPSERT_EDGES,
  UPSERT_NODES,
} from "./cypher.js";

export type Neo4jIntegrationStatus = "verified" | "unverified";

export function neo4jConfigFromEnv(): { uri: string; user: string; password: string } | null {
  const uri = process.env.NEO4J_URI?.trim() ?? "";
  if (!uri) {
    return null;
  }
  return {
    uri,
    user: process.env.NEO4J_USER?.trim() || "neo4j",
    password: process.env.NEO4J_PASSWORD ?? "",
  };
}

export function hasNeo4jConfig(): boolean {
  return neo4jConfigFromEnv() !== null;
}

function emptyGraph(): EvidenceGraph {
  return { schemaVersion: 1, nodes: [], edges: [] };
}

function payload(value: unknown): string {
  return JSON.stringify(value);
}

function parsePayload<T>(raw: unknown): T {
  if (typeof raw !== "string") {
    throw new Error("neo4j payload missing");
  }
  return JSON.parse(raw) as T;
}

export class Neo4jGraphStore implements AsyncGraphStore {
  constructor(private readonly driver: Driver) {}

  async close(): Promise<void> {
    await this.driver.close();
  }

  async ensureSchema(): Promise<void> {
    const session = this.session();
    try {
      for (const statement of [...CONSTRAINTS, ...INDEXES]) {
        await session.executeWrite((tx) => tx.run(statement));
      }
    } finally {
      await session.close();
    }
  }

  async importGraph(scope: StoreScope, graph: EvidenceGraph): Promise<GraphValidation> {
    const existing = await this.raw(scope);
    const staging = new InMemoryGraphStore();
    if (existing.nodes.length > 0 || existing.edges.length > 0) {
      const prior = staging.importGraph(scope, existing);
      if (!prior.ok) {
        return prior;
      }
    }
    const result = staging.importGraph(scope, graph);
    if (!result.ok) {
      return result;
    }
    const next = staging.exportGraph(scope, { redact: false });
    await this.replaceScope(scope, next);
    return result;
  }

  async exportGraph(scope: StoreScope, options: ExportOptions = {}): Promise<EvidenceGraph> {
    const graph = await this.raw(scope);
    return options.redact !== false ? redactGraph(graph) : graph;
  }

  async getNode(scope: StoreScope, id: string): Promise<GraphNode | undefined> {
    const session = this.session();
    try {
      const result = await session.executeRead((tx) =>
        tx.run(LOAD_NODE, { tenantId: scope.tenantId, matterId: scope.matterId, id }),
      );
      const raw = result.records[0]?.get("payload");
      if (typeof raw !== "string") {
        return undefined;
      }
      return parsePayload<GraphNode>(raw);
    } finally {
      await session.close();
    }
  }

  async evidenceTrace(scope: StoreScope, startId: string): Promise<Trace> {
    return new InMemoryGraphStoreAfter(await this.raw(scope), scope).evidenceTrace(scope, startId);
  }

  async contradictionTrace(scope: StoreScope, propositionId: string): Promise<Trace> {
    return new InMemoryGraphStoreAfter(await this.raw(scope), scope).contradictionTrace(scope, propositionId);
  }

  async changeImpact(scope: StoreScope, startId: string): Promise<Trace> {
    return new InMemoryGraphStoreAfter(await this.raw(scope), scope).changeImpact(scope, startId);
  }

  async reviewerTrace(scope: StoreScope, memoId: string): Promise<Trace> {
    return new InMemoryGraphStoreAfter(await this.raw(scope), scope).reviewerTrace(scope, memoId);
  }

  async failureReplay(scope: StoreScope, propositionId: string): Promise<Trace> {
    return new InMemoryGraphStoreAfter(await this.raw(scope), scope).failureReplay(scope, propositionId);
  }

  private session(): Session {
    return this.driver.session();
  }

  private async raw(scope: StoreScope): Promise<EvidenceGraph> {
    const session = this.session();
    try {
      const nodesResult = await session.executeRead((tx) =>
        tx.run(LOAD_NODES, { tenantId: scope.tenantId, matterId: scope.matterId }),
      );
      const edgesResult = await session.executeRead((tx) =>
        tx.run(LOAD_EDGES, { tenantId: scope.tenantId, matterId: scope.matterId }),
      );
      const nodes = nodesResult.records.map((record) => parsePayload<GraphNode>(record.get("payload")));
      const edges = edgesResult.records.map((record) => parsePayload<EvidenceGraph["edges"][number]>(record.get("payload")));
      if (nodes.length === 0 && edges.length === 0) {
        return emptyGraph();
      }
      return { schemaVersion: 1, nodes, edges };
    } finally {
      await session.close();
    }
  }

  private async replaceScope(scope: StoreScope, graph: EvidenceGraph): Promise<void> {
    const session = this.session();
    const tenantId = scope.tenantId;
    const matterId = scope.matterId;
    try {
      await session.executeWrite(async (tx) => {
        await tx.run(DELETE_SCOPE_NODES, { tenantId, matterId });
        await tx.run(DELETE_SCOPE_EDGES, { tenantId, matterId });
        if (graph.nodes.length > 0) {
          await tx.run(UPSERT_NODES, {
            tenantId,
            matterId,
            nodes: graph.nodes.map((node) => ({ id: node.id, payload: payload(node) })),
          });
        }
        if (graph.edges.length > 0) {
          await tx.run(UPSERT_EDGES, {
            tenantId,
            matterId,
            edges: graph.edges.map((edge) => ({
              id: edge.id,
              fromId: edge.fromId,
              toId: edge.toId,
              payload: payload(edge),
            })),
          });
        }
      });
    } finally {
      await session.close();
    }
  }
}

class InMemoryGraphStoreAfter {
  private readonly store = new InMemoryGraphStore();

  constructor(graph: EvidenceGraph, scope: StoreScope) {
    if (graph.nodes.length === 0 && graph.edges.length === 0) {
      return;
    }
    const result = this.store.importGraph(scope, graph);
    if (!result.ok) {
      throw new Error(result.issues.map((issue) => issue.code).join(","));
    }
  }

  evidenceTrace(scope: StoreScope, startId: string): Trace {
    return this.store.evidenceTrace(scope, startId);
  }

  contradictionTrace(scope: StoreScope, propositionId: string): Trace {
    return this.store.contradictionTrace(scope, propositionId);
  }

  changeImpact(scope: StoreScope, startId: string): Trace {
    return this.store.changeImpact(scope, startId);
  }

  reviewerTrace(scope: StoreScope, memoId: string): Trace {
    return this.store.reviewerTrace(scope, memoId);
  }

  failureReplay(scope: StoreScope, propositionId: string): Trace {
    return this.store.failureReplay(scope, propositionId);
  }
}

export async function openNeo4jStore(): Promise<Neo4jGraphStore> {
  const config = neo4jConfigFromEnv();
  if (!config) {
    throw new Error("NEO4J_URI is not set; Neo4j adapter remains unverified in this environment");
  }
  const driver = neo4j.driver(config.uri, neo4j.auth.basic(config.user, config.password));
  const store = new Neo4jGraphStore(driver);
  await store.ensureSchema();
  return store;
}

export async function verifyNeo4jConformance(fixture: {
  scope: StoreScope;
  graph: EvidenceGraph;
}): Promise<{ status: Neo4jIntegrationStatus; failures: Awaited<ReturnType<typeof runAsyncAdapterConformance>> }> {
  if (!hasNeo4jConfig()) {
    return { status: "unverified", failures: [] };
  }
  const store = await openNeo4jStore();
  try {
    const failures = await runAsyncAdapterConformance(() => store, fixture);
    return { status: failures.length === 0 ? "verified" : "unverified", failures };
  } finally {
    await store.close();
  }
}
