import { validateGraph } from "./validate.js";
import type { EvidenceGraph, GraphNode, GraphValidation } from "./types.js";
import {
  type ExportOptions,
  type GraphStore,
  type StoreScope,
  type Trace,
  scopeKey,
} from "./adapter.js";
import { redactGraph } from "./serialize.js";
import {
  changeImpact as walkImpact,
  contradictionTrace as walkContradiction,
  evidenceTrace as walkEvidence,
  failureReplay as walkReplay,
  reviewerTrace as walkReviewer,
} from "./traverse.js";

const SNAPSHOT_TYPES = new Set(["Passage", "AuthorityVersion", "Opinion"]);

function emptyGraph(): EvidenceGraph {
  return { schemaVersion: 1, nodes: [], edges: [] };
}

function visibleInScope(scope: StoreScope, node: GraphNode): boolean {
  if (node.tenantId && node.tenantId !== scope.tenantId) {
    return false;
  }
  if (node.matterId && node.matterId !== scope.matterId) {
    return false;
  }
  return true;
}

export class InMemoryGraphStore implements GraphStore {
  private readonly graphs = new Map<string, EvidenceGraph>();

  importGraph(scope: StoreScope, graph: EvidenceGraph): GraphValidation {
    const validated = validateGraph(graph);
    if (!validated.ok) {
      return validated;
    }
    for (const node of graph.nodes) {
      if (!visibleInScope(scope, node)) {
        return {
          ok: false,
          issues: [{ code: "isolation_mismatch", message: `node ${node.id} outside import scope` }],
        };
      }
    }
    for (const edge of graph.edges) {
      if (edge.tenantId && edge.tenantId !== scope.tenantId) {
        return {
          ok: false,
          issues: [{ code: "isolation_mismatch", message: `edge ${edge.id} outside import scope` }],
        };
      }
      if (edge.matterId && edge.matterId !== scope.matterId) {
        return {
          ok: false,
          issues: [{ code: "isolation_mismatch", message: `edge ${edge.id} outside import scope` }],
        };
      }
    }
    const existing = this.graphs.get(scopeKey(scope));
    if (existing) {
      const prior = new Map(existing.nodes.map((node) => [node.id, node]));
      for (const node of graph.nodes) {
        const previous = prior.get(node.id);
        if (!previous) {
          continue;
        }
        if (
          SNAPSHOT_TYPES.has(node.type) &&
          previous.contentHash &&
          node.contentHash &&
          previous.contentHash !== node.contentHash
        ) {
          return {
            ok: false,
            issues: [{ code: "immutable_snapshot", message: `cannot replace snapshot ${node.id}`, nodeId: node.id }],
          };
        }
        if (
          node.type === "ReviewerDecision" &&
          previous.attributes.status === "accepted"
        ) {
          return {
            ok: false,
            issues: [{ code: "immutable_review", message: `accepted reviewer decision ${node.id} is append-only` }],
          };
        }
      }
    }
    this.graphs.set(scopeKey(scope), {
      schemaVersion: graph.schemaVersion,
      nodes: graph.nodes.map((node) => ({ ...node, attributes: { ...node.attributes } })),
      edges: graph.edges.map((edge) => ({ ...edge })),
    });
    return { ok: true, issues: [] };
  }

  exportGraph(scope: StoreScope, options: ExportOptions = {}): EvidenceGraph {
    const graph = this.graphs.get(scopeKey(scope)) ?? emptyGraph();
    const redact = options.redact !== false;
    return redact ? redactGraph(graph) : graph;
  }

  getNode(scope: StoreScope, id: string): GraphNode | undefined {
    const graph = this.graphs.get(scopeKey(scope));
    const node = graph?.nodes.find((item) => item.id === id);
    if (!node || !visibleInScope(scope, node)) {
      return undefined;
    }
    return node;
  }

  evidenceTrace(scope: StoreScope, startId: string): Trace {
    return walkEvidence(this.raw(scope), startId);
  }

  contradictionTrace(scope: StoreScope, propositionId: string): Trace {
    return walkContradiction(this.raw(scope), propositionId);
  }

  changeImpact(scope: StoreScope, startId: string): Trace {
    return walkImpact(this.raw(scope), startId);
  }

  reviewerTrace(scope: StoreScope, memoId: string): Trace {
    return walkReviewer(this.raw(scope), memoId);
  }

  failureReplay(scope: StoreScope, propositionId: string): Trace {
    return walkReplay(this.raw(scope), propositionId);
  }

  private raw(scope: StoreScope): EvidenceGraph {
    return this.graphs.get(scopeKey(scope)) ?? emptyGraph();
  }
}
