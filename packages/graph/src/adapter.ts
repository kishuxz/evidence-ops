import type { EvidenceGraph, GraphNode, GraphValidation } from "./types.js";

export type StoreScope = {
  tenantId: string;
  matterId: string;
};

export type TraceStep = {
  nodeId: string;
  type: string;
  via: string | null;
  impactKind: "direct" | "transitive" | null;
};

export type Trace = {
  kind: "evidence" | "contradiction" | "impact" | "reviewer" | "replay";
  startId: string;
  steps: TraceStep[];
};

export type ExportOptions = {
  redact?: boolean;
};

export interface GraphStore {
  importGraph(scope: StoreScope, graph: EvidenceGraph): GraphValidation;
  exportGraph(scope: StoreScope, options?: ExportOptions): EvidenceGraph;
  getNode(scope: StoreScope, id: string): GraphNode | undefined;
  evidenceTrace(scope: StoreScope, startId: string): Trace;
  contradictionTrace(scope: StoreScope, propositionId: string): Trace;
  changeImpact(scope: StoreScope, startId: string): Trace;
  reviewerTrace(scope: StoreScope, memoId: string): Trace;
  failureReplay(scope: StoreScope, propositionId: string): Trace;
}

export function scopeKey(scope: StoreScope): string {
  return `${scope.tenantId}\n${scope.matterId}`;
}
