import { createHash } from "node:crypto";
import { canonicalJson } from "@evidenceops/contracts";
import type { GraphEdge } from "./types.js";

export function edgeId(edge: Omit<GraphEdge, "id">): string {
  const digest = createHash("sha256")
    .update(
      canonicalJson({
        fromId: edge.fromId,
        impactKind: edge.impactKind,
        matterId: edge.matterId,
        schemaVersion: edge.schemaVersion,
        tenantId: edge.tenantId,
        toId: edge.toId,
        type: edge.type,
      }),
      "utf8",
    )
    .digest("hex")
    .slice(0, 32);
  return `edg_${digest}`;
}
