import {
  loadCatalog,
  propositionAdmissibleInMemo,
  validateEnvelope,
} from "@evidenceops/contracts";
import type { EvidenceGraph, GraphEdge, GraphIssue, GraphNode, GraphValidation } from "./types.js";

const CHECKS = ["identityCheck", "passageCheck", "propositionCheck"] as const;

function issue(code: string, message: string, extra: Partial<GraphIssue> = {}): GraphIssue {
  return { code, message, ...extra };
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function cycle(nodes: string[], edges: Map<string, string[]>): boolean {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const walk = (id: string): boolean => {
    if (visiting.has(id)) {
      return true;
    }
    if (visited.has(id)) {
      return false;
    }
    visiting.add(id);
    for (const next of edges.get(id) ?? []) {
      if (walk(next)) {
        return true;
      }
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  };
  return nodes.some((id) => walk(id));
}

function isolationOk(edge: GraphEdge, from: GraphNode, to: GraphNode): boolean {
  const tenants = [from.tenantId, to.tenantId, edge.tenantId].filter((value): value is string => value !== null);
  if (tenants.length > 0 && tenants.some((value) => value !== tenants[0])) {
    return false;
  }
  const matters = [from.matterId, to.matterId, edge.matterId].filter((value): value is string => value !== null);
  if (matters.length > 0 && matters.some((value) => value !== matters[0])) {
    return false;
  }
  return true;
}

export function validateGraph(graph: EvidenceGraph): GraphValidation {
  const issues: GraphIssue[] = [];
  const catalog = loadCatalog();
  if (graph.schemaVersion !== catalog.schemaVersion) {
    issues.push(issue("schema_version", "unsupported graph schemaVersion"));
    return { ok: false, issues };
  }

  const byId = new Map<string, GraphNode>();
  for (const node of graph.nodes) {
    if (byId.has(node.id)) {
      issues.push(issue("duplicate_id", `duplicate node id ${node.id}`, { nodeId: node.id }));
      continue;
    }
    byId.set(node.id, node);
    try {
      validateEnvelope(node);
    } catch (error) {
      issues.push(
        issue("invalid_envelope", error instanceof Error ? error.message : "invalid envelope", { nodeId: node.id }),
      );
    }
    if (!catalog.nodeTypes.some((item) => item.name === node.type)) {
      issues.push(issue("unknown_node_type", `unknown node type ${node.type}`, { nodeId: node.id }));
    }
    if (node.type === "Authority") {
      const availability = asString(node.attributes.dataAvailability);
      if (!availability) {
        issues.push(issue("implicit_unknown", "Authority dataAvailability must be explicit", { nodeId: node.id }));
      } else if (!catalog.dataAvailability.includes(availability)) {
        issues.push(issue("implicit_unknown", `unknown dataAvailability ${availability}`, { nodeId: node.id }));
      }
    }
    if (node.type === "Citation" && node.attributes.verified === true) {
      const incomplete = CHECKS.some((field) => node.attributes[field] !== "complete");
      if (incomplete) {
        issues.push(
          issue("citation_unverified", "citation cannot be verified until identity, passage, and proposition checks complete", {
            nodeId: node.id,
          }),
        );
      }
    }
  }

  const derived = new Map<string, string[]>();
  for (const edge of graph.edges) {
    if (!catalog.edgeTypes.includes(edge.type)) {
      issues.push(issue("unknown_edge_type", `unknown edge type ${edge.type}`, { edgeId: edge.id }));
    }
    const from = byId.get(edge.fromId);
    const to = byId.get(edge.toId);
    if (!from || !to) {
      issues.push(issue("missing_endpoint", "edge endpoint does not exist", { edgeId: edge.id }));
      continue;
    }
    if (!isolationOk(edge, from, to)) {
      issues.push(issue("isolation_mismatch", "edge crosses tenant or matter isolation", { edgeId: edge.id }));
    }
    if (edge.type === "SUPPORTS") {
      if (to.type !== "Passage") {
        issues.push(issue("supports_not_passage", "SUPPORTS must target a Passage", { edgeId: edge.id }));
      } else {
        const versionId = asString(to.attributes.authorityVersionId);
        if (!versionId || byId.get(versionId)?.type !== "AuthorityVersion") {
          issues.push(
            issue("supports_missing_authority_version", "SUPPORTS passage must name an AuthorityVersion in the graph", {
              edgeId: edge.id,
            }),
          );
        }
      }
    }
    if ((edge.type === "INVALIDATES" || edge.type === "DEPENDS_ON") && edge.impactKind === null) {
      issues.push(issue("impact_kind_missing", `${edge.type} must declare direct or transitive impact`, { edgeId: edge.id }));
    }
    if (edge.type === "DERIVED_FROM") {
      const list = derived.get(edge.fromId) ?? [];
      list.push(edge.toId);
      derived.set(edge.fromId, list);
    }
    if (from.type === "Memo" && from.attributes.status === "accepted" && (edge.type === "ASSERTS" || edge.type === "DECIDES")) {
      if (to.type === "LegalProposition") {
        const verdictEdge = graph.edges.find(
          (item) => item.type === "EVALUATED_BY" && item.fromId === to.id && byId.get(item.toId)?.type === "Verdict",
        );
        const verdictNode = verdictEdge ? byId.get(verdictEdge.toId) : undefined;
        const verdict = asString(verdictNode?.attributes.verdict);
        const reviewerState = asString(verdictNode?.attributes.reviewerState);
        if (!verdict || !reviewerState || !propositionAdmissibleInMemo(verdict, reviewerState)) {
          issues.push(
            issue("memo_inadmissible_proposition", "accepted memo cannot include an inadmissible proposition", {
              edgeId: edge.id,
              nodeId: to.id,
            }),
          );
        }
      }
    }
  }

  if (cycle([...derived.keys()], derived)) {
    issues.push(issue("derived_from_cycle", "DERIVED_FROM and version ancestry must be acyclic"));
  }

  return { ok: issues.length === 0, issues };
}
