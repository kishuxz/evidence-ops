import { stableId, type EvidenceEnvelope } from "@evidenceops/contracts";
import { edgeId } from "../src/ids.js";
import type { EvidenceGraph, GraphEdge, GraphNode } from "../src/types.js";

const HEX32 = "a".repeat(32);

export function envelope(
  type: string,
  id: string,
  fields: Partial<EvidenceEnvelope> & { attributes?: GraphNode["attributes"] } = {},
): GraphNode {
  const { attributes, ...rest } = fields;
  return {
    schemaVersion: 1,
    type,
    id,
    tenantId: rest.tenantId ?? null,
    matterId: rest.matterId ?? null,
    sourceLocator: rest.sourceLocator ?? null,
    retrievedAt: rest.retrievedAt ?? null,
    contentHash: rest.contentHash ?? null,
    redaction: rest.redaction ?? "public",
    attributes: attributes ?? {},
  };
}

export function makeEdge(
  type: string,
  fromId: string,
  toId: string,
  extra: Partial<GraphEdge> = {},
): GraphEdge {
  const draft = {
    schemaVersion: 1,
    type,
    fromId,
    toId,
    tenantId: extra.tenantId ?? null,
    matterId: extra.matterId ?? null,
    impactKind: extra.impactKind ?? null,
  };
  return { ...draft, id: extra.id ?? edgeId(draft) };
}

export function tenantId(slug = "acme"): string {
  return stableId("Tenant", { slug });
}

export function placeholder(prefix: string): string {
  return `${prefix}_${HEX32}`;
}
