import type { EvidenceGraph, GraphEdge, GraphNode } from "./types.js";
import type { Trace, TraceStep } from "./adapter.js";

function compareId(left: string, right: string): number {
  return left.localeCompare(right);
}

function nodeMap(graph: EvidenceGraph): Map<string, GraphNode> {
  return new Map(graph.nodes.map((node) => [node.id, node]));
}

function linked(
  graph: EvidenceGraph,
  id: string,
  types: Set<string>,
  direction: "out" | "in" | "both",
): GraphEdge[] {
  return graph.edges
    .filter((edge) => {
      if (!types.has(edge.type)) {
        return false;
      }
      if (direction === "out") {
        return edge.fromId === id;
      }
      if (direction === "in") {
        return edge.toId === id;
      }
      return edge.fromId === id || edge.toId === id;
    })
    .sort((left, right) => compareId(left.id, right.id));
}

function other(edge: GraphEdge, id: string): string {
  return edge.fromId === id ? edge.toId : edge.fromId;
}

function pushStep(
  steps: TraceStep[],
  seen: Set<string>,
  node: GraphNode | undefined,
  via: string | null,
  impactKind: TraceStep["impactKind"],
): void {
  if (!node || seen.has(node.id)) {
    return;
  }
  seen.add(node.id);
  steps.push({ nodeId: node.id, type: node.type, via, impactKind });
}

export function evidenceTrace(graph: EvidenceGraph, startId: string): Trace {
  const nodes = nodeMap(graph);
  const steps: TraceStep[] = [];
  const seen = new Set<string>();
  const start = nodes.get(startId);
  pushStep(steps, seen, start, null, null);
  const queue = start ? [start.id] : [];
  const forward = new Set([
    "ASSERTS",
    "DECIDES",
    "SUPPORTS",
    "PARTIALLY_SUPPORTS",
    "QUOTES",
    "CITES",
    "EVALUATED_BY",
  ]);
  while (queue.length > 0) {
    queue.sort(compareId);
    const id = queue.shift();
    if (!id) {
      break;
    }
    const current = nodes.get(id);
    if (current?.type === "Passage") {
      const versionId = current.attributes.authorityVersionId;
      if (typeof versionId === "string") {
        pushStep(steps, seen, nodes.get(versionId), "AUTHORITY_VERSION", null);
        const version = nodes.get(versionId);
        const authorityId = version?.attributes.authorityId;
        if (typeof authorityId === "string") {
          pushStep(steps, seen, nodes.get(authorityId), "AUTHORITY", null);
        }
      }
    }
    for (const edge of linked(graph, id, forward, "out")) {
      const nextId = other(edge, id);
      if (!seen.has(nextId)) {
        pushStep(steps, seen, nodes.get(nextId), edge.type, edge.impactKind);
        queue.push(nextId);
      }
    }
  }
  return { kind: "evidence", startId, steps };
}

export function contradictionTrace(graph: EvidenceGraph, propositionId: string): Trace {
  const nodes = nodeMap(graph);
  const steps: TraceStep[] = [];
  const seen = new Set<string>();
  pushStep(steps, seen, nodes.get(propositionId), null, null);
  for (const edge of linked(graph, propositionId, new Set(["CONTRADICTS", "DISTINGUISHES"]), "both")) {
    pushStep(steps, seen, nodes.get(other(edge, propositionId)), edge.type, edge.impactKind);
  }
  return { kind: "contradiction", startId: propositionId, steps };
}

export function changeImpact(graph: EvidenceGraph, startId: string): Trace {
  const nodes = nodeMap(graph);
  const steps: TraceStep[] = [];
  const seen = new Set<string>();
  pushStep(steps, seen, nodes.get(startId), null, null);
  const direct: TraceStep[] = [];
  const transitive: TraceStep[] = [];
  for (const edge of linked(graph, startId, new Set(["INVALIDATES", "DEPENDS_ON"]), "out")) {
    const node = nodes.get(edge.toId);
    if (!node || seen.has(node.id)) {
      continue;
    }
    seen.add(node.id);
    const step: TraceStep = { nodeId: node.id, type: node.type, via: edge.type, impactKind: edge.impactKind };
    if (edge.impactKind === "transitive") {
      transitive.push(step);
    } else {
      direct.push(step);
    }
  }
  direct.sort((left, right) => compareId(left.nodeId, right.nodeId));
  transitive.sort((left, right) => compareId(left.nodeId, right.nodeId));
  steps.push(...direct, ...transitive);
  return { kind: "impact", startId, steps };
}

export function reviewerTrace(graph: EvidenceGraph, memoId: string): Trace {
  const nodes = nodeMap(graph);
  const steps: TraceStep[] = [];
  const seen = new Set<string>();
  pushStep(steps, seen, nodes.get(memoId), null, null);
  for (const edge of linked(graph, memoId, new Set(["REVIEWED_BY"]), "out")) {
    const decision = nodes.get(edge.toId);
    pushStep(steps, seen, decision, edge.type, null);
    const visible = decision?.attributes.visibleEvidenceIds;
    if (Array.isArray(visible)) {
      const ids = visible.filter((value): value is string => typeof value === "string").sort(compareId);
      for (const id of ids) {
        pushStep(steps, seen, nodes.get(id), "VISIBLE_AT_DECISION", null);
      }
    }
  }
  for (const edge of linked(graph, memoId, new Set(["ASSERTS", "DECIDES"]), "out")) {
    pushStep(steps, seen, nodes.get(edge.toId), edge.type, null);
  }
  return { kind: "reviewer", startId: memoId, steps };
}

export function failureReplay(graph: EvidenceGraph, propositionId: string): Trace {
  const nodes = nodeMap(graph);
  const steps: TraceStep[] = [];
  const seen = new Set<string>();
  pushStep(steps, seen, nodes.get(propositionId), null, null);
  for (const edge of linked(graph, propositionId, new Set(["EVALUATED_BY"]), "out")) {
    pushStep(steps, seen, nodes.get(edge.toId), edge.type, null);
  }
  const retrievals = graph.nodes
    .filter((node) => node.type === "Retrieval")
    .sort((left, right) => {
      const leftAt = left.retrievedAt ?? "";
      const rightAt = right.retrievedAt ?? "";
      return leftAt.localeCompare(rightAt) || compareId(left.id, right.id);
    });
  const earliest = retrievals[0];
  pushStep(steps, seen, earliest, "EARLIEST_RETRIEVAL", "direct");
  for (const edge of linked(graph, propositionId, new Set(["DEPENDS_ON", "REPLAYED_AS", "DERIVED_FROM"]), "both")) {
    pushStep(steps, seen, nodes.get(other(edge, propositionId)), edge.type, edge.impactKind);
  }
  return { kind: "replay", startId: propositionId, steps };
}
