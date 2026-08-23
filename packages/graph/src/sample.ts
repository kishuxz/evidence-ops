import { stableId, type EvidenceEnvelope } from "@evidenceops/contracts";
import { edgeId } from "./ids.js";
import type { EvidenceGraph, GraphEdge, GraphNode } from "./types.js";

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

export function sampleSupportingGraph(slug = "acme") {
  const tenant = tenantId(slug);
  const matter = stableId("Matter", { tenantId: tenant, slug: "m1" });
  const authority = stableId("Authority", { jurisdictionCode: "US-FED", citationKey: `${slug} 1 U.S. 1` });
  const version = stableId("AuthorityVersion", { authorityId: authority, versionLocator: "v1" });
  const passage = stableId("Passage", {
    authorityVersionId: version,
    locator: "p.1",
    contentHash: "b".repeat(64),
  });
  const proposition = stableId("LegalProposition", { matterId: matter, slug: "p1" });
  const run = stableId("ResearchRun", { matterId: matter, idempotencyKey: "run-1" });
  const verdict = stableId("Verdict", { researchRunId: run, propositionId: proposition, sequence: 1 });
  const memo = stableId("Memo", { matterId: matter, slug: "memo-1" });
  const conclusion = stableId("Conclusion", { matterId: matter, slug: "c1" });
  const reviewer = stableId("User", { tenantId: tenant, subject: "reviewer-1" });
  const decision = stableId("ReviewerDecision", { memoId: memo, reviewerUserId: reviewer, sequence: 1 });
  const retrieval = stableId("Retrieval", {
    researchRunId: run,
    documentId: authority,
    queryHash: "c".repeat(64),
  });
  const graph: EvidenceGraph = {
    schemaVersion: 1,
    nodes: [
      envelope("Tenant", tenant, { tenantId: tenant }),
      envelope("User", reviewer, { tenantId: tenant }),
      envelope("Matter", matter, { tenantId: tenant, matterId: matter }),
      envelope("Authority", authority, { attributes: { dataAvailability: "available" } }),
      envelope("AuthorityVersion", version, {
        contentHash: "d".repeat(64),
        attributes: { authorityId: authority, sourceLocator: "fixture://opinion/v1" },
      }),
      envelope("Passage", passage, {
        contentHash: "b".repeat(64),
        attributes: { authorityVersionId: version, text: "The filing deadline is jurisdictional." },
      }),
      envelope("LegalProposition", proposition, {
        tenantId: tenant,
        matterId: matter,
        attributes: { text: "The filing deadline is jurisdictional." },
      }),
      envelope("Verdict", verdict, {
        tenantId: tenant,
        matterId: matter,
        attributes: { verdict: "FULL_SUPPORT", reviewerState: "accepted" },
      }),
      envelope("Memo", memo, { tenantId: tenant, matterId: matter, attributes: { status: "accepted", text: "hold" } }),
      envelope("Conclusion", conclusion, { tenantId: tenant, matterId: matter, attributes: { text: "hold" } }),
      envelope("ReviewerDecision", decision, {
        tenantId: tenant,
        matterId: matter,
        attributes: { status: "accepted", visibleEvidenceIds: [proposition, passage] },
      }),
      envelope("Retrieval", retrieval, {
        tenantId: tenant,
        matterId: matter,
        retrievedAt: "2026-01-01T00:00:00Z",
        attributes: { documentId: authority },
      }),
      envelope("ResearchRun", run, { tenantId: tenant, matterId: matter }),
    ],
    edges: [
      makeEdge("SUPPORTS", proposition, passage, { tenantId: tenant, matterId: matter }),
      makeEdge("EVALUATED_BY", proposition, verdict, { tenantId: tenant, matterId: matter }),
      makeEdge("ASSERTS", memo, proposition, { tenantId: tenant, matterId: matter }),
      makeEdge("DECIDES", conclusion, proposition, { tenantId: tenant, matterId: matter }),
      makeEdge("REVIEWED_BY", memo, decision, { tenantId: tenant, matterId: matter }),
      makeEdge("DEPENDS_ON", proposition, retrieval, {
        tenantId: tenant,
        matterId: matter,
        impactKind: "direct",
      }),
    ],
  };
  return {
    tenant,
    matter,
    authority,
    version,
    passage,
    proposition,
    verdict,
    memo,
    conclusion,
    decision,
    retrieval,
    reviewer,
    run,
    graph,
    scope: { tenantId: tenant, matterId: matter },
  };
}
