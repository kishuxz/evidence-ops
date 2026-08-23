import { canonicalJson } from "@evidenceops/contracts";
import type { EvidenceGraph, GraphEdge, GraphNode, JsonValue } from "./types.js";

function byId<T extends { id: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => left.id.localeCompare(right.id));
}

function asJson(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

export function normalizeGraph(graph: EvidenceGraph): EvidenceGraph {
  return {
    schemaVersion: graph.schemaVersion,
    nodes: byId(graph.nodes),
    edges: byId(graph.edges),
  };
}

export function graphToCanonicalJson(graph: EvidenceGraph): string {
  return canonicalJson(asJson(normalizeGraph(graph)));
}

export function graphToJsonl(graph: EvidenceGraph): string {
  const normalized = normalizeGraph(graph);
  const lines = [`{"kind":"meta","schemaVersion":${normalized.schemaVersion}}`];
  for (const node of normalized.nodes) {
    lines.push(canonicalJson({ kind: "node", ...asJson(node) as Record<string, JsonValue> }));
  }
  for (const edge of normalized.edges) {
    lines.push(canonicalJson({ kind: "edge", ...asJson(edge) as Record<string, JsonValue> }));
  }
  return `${lines.join("\n")}\n`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function graphFromJson(text: string): EvidenceGraph {
  const parsed: unknown = JSON.parse(text);
  if (!isRecord(parsed) || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
    throw new Error("graph json: expected {schemaVersion,nodes,edges}");
  }
  return {
    schemaVersion: Number(parsed.schemaVersion),
    nodes: parsed.nodes as GraphNode[],
    edges: parsed.edges as GraphEdge[],
  };
}

export function graphFromJsonl(text: string): EvidenceGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  let schemaVersion = 1;
  for (const line of text.split("\n")) {
    if (line.trim() === "") {
      continue;
    }
    const parsed: unknown = JSON.parse(line);
    if (!isRecord(parsed) || typeof parsed.kind !== "string") {
      throw new Error("graph jsonl: each line needs kind");
    }
    if (parsed.kind === "meta") {
      schemaVersion = Number(parsed.schemaVersion);
    } else if (parsed.kind === "node") {
      const { kind: _kind, ...node } = parsed;
      nodes.push(node as GraphNode);
    } else if (parsed.kind === "edge") {
      const { kind: _kind, ...edge } = parsed;
      edges.push(edge as GraphEdge);
    } else {
      throw new Error(`graph jsonl: unknown kind ${parsed.kind}`);
    }
  }
  return { schemaVersion, nodes, edges };
}

export function redactGraph(graph: EvidenceGraph): EvidenceGraph {
  return {
    schemaVersion: graph.schemaVersion,
    nodes: graph.nodes.map((node) => {
      if (node.redaction === "confidential" || node.redaction === "privileged") {
        return {
          ...node,
          sourceLocator: null,
          attributes: { redacted: true },
        };
      }
      return node;
    }),
    edges: graph.edges,
  };
}
