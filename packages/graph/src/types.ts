import type { EvidenceEnvelope } from "@evidenceops/contracts";

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type GraphNode = EvidenceEnvelope & {
  attributes: Record<string, JsonValue>;
};

export type GraphEdge = {
  schemaVersion: number;
  type: string;
  id: string;
  fromId: string;
  toId: string;
  tenantId: string | null;
  matterId: string | null;
  impactKind: "direct" | "transitive" | null;
};

export type EvidenceGraph = {
  schemaVersion: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type GraphIssue = {
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
};

export type GraphValidation = {
  ok: boolean;
  issues: GraphIssue[];
};
