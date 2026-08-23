import { stableId } from "@evidenceops/contracts";
import { describe, expect, it } from "vitest";
import { validateGraph } from "../src/validate.js";
import { envelope, makeEdge, tenantId } from "./fixtures.js";

function validAuthorityGraph() {
  const tenant = tenantId();
  const matter = stableId("Matter", { tenantId: tenant, slug: "m1" });
  const authority = stableId("Authority", { jurisdictionCode: "US-FED", citationKey: "1 U.S. 1" });
  const version = stableId("AuthorityVersion", { authorityId: authority, versionLocator: "v1" });
  const passage = stableId("Passage", { authorityVersionId: version, locator: "p.1", contentHash: "b".repeat(64) });
  const proposition = stableId("LegalProposition", { matterId: matter, slug: "p1" });
  const run = stableId("ResearchRun", { matterId: matter, idempotencyKey: "run-1" });
  const verdict = stableId("Verdict", { researchRunId: run, propositionId: proposition, sequence: 1 });
  const memo = stableId("Memo", { matterId: matter, slug: "memo-1" });
  return {
    tenant,
    matter,
    authority,
    version,
    passage,
    proposition,
    verdict,
    memo,
    graph: {
      schemaVersion: 1,
      nodes: [
        envelope("Tenant", tenant, { tenantId: tenant }),
        envelope("Matter", matter, { tenantId: tenant, matterId: matter }),
        envelope("Authority", authority, { attributes: { dataAvailability: "available" } }),
        envelope("AuthorityVersion", version, { attributes: { authorityId: authority } }),
        envelope("Passage", passage, { attributes: { authorityVersionId: version } }),
        envelope("LegalProposition", proposition, { tenantId: tenant, matterId: matter }),
        envelope("Verdict", verdict, {
          tenantId: tenant,
          matterId: matter,
          attributes: { verdict: "FULL_SUPPORT", reviewerState: "accepted" },
        }),
        envelope("Memo", memo, { tenantId: tenant, matterId: matter, attributes: { status: "accepted" } }),
      ],
      edges: [
        makeEdge("SUPPORTS", proposition, passage, { tenantId: tenant, matterId: matter }),
        makeEdge("EVALUATED_BY", proposition, verdict, { tenantId: tenant, matterId: matter }),
        makeEdge("ASSERTS", memo, proposition, { tenantId: tenant, matterId: matter }),
      ],
    },
  };
}

describe("validateGraph", () => {
  it("accepts a minimal isolated supporting graph", () => {
    const result = validateGraph(validAuthorityGraph().graph);
    expect(result.issues).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("rejects a cross-tenant edge", () => {
    const left = validAuthorityGraph();
    const other = tenantId("other");
    left.graph.nodes.push(envelope("LegalProposition", stableId("LegalProposition", { matterId: "x", slug: "q" }), {
      tenantId: other,
      matterId: stableId("Matter", { tenantId: other, slug: "n" }),
    }));
    const foreign = left.graph.nodes.at(-1);
    if (!foreign) {
      throw new Error("missing node");
    }
    left.graph.edges.push(makeEdge("ASSERTS", left.memo, foreign.id, { tenantId: left.tenant, matterId: left.matter }));
    const result = validateGraph(left.graph);
    expect(result.ok).toBe(false);
    expect(result.issues.some((item) => item.code === "isolation_mismatch")).toBe(true);
  });

  it("rejects SUPPORTS that do not target a passage", () => {
    const fixture = validAuthorityGraph();
    fixture.graph.edges.push(makeEdge("SUPPORTS", fixture.proposition, fixture.authority, {
      tenantId: fixture.tenant,
      matterId: fixture.matter,
    }));
    const result = validateGraph(fixture.graph);
    expect(result.issues.some((item) => item.code === "supports_not_passage")).toBe(true);
  });

  it("rejects a verified citation before all three checks complete", () => {
    const fixture = validAuthorityGraph();
    const citation = stableId("Citation", { matterId: fixture.matter, rawText: "1 U.S. 1" });
    fixture.graph.nodes.push(
      envelope("Citation", citation, {
        tenantId: fixture.tenant,
        matterId: fixture.matter,
        attributes: {
          verified: true,
          identityCheck: "complete",
          passageCheck: "pending",
          propositionCheck: "complete",
        },
      }),
    );
    const result = validateGraph(fixture.graph);
    expect(result.issues.some((item) => item.code === "citation_unverified")).toBe(true);
  });

  it("rejects DERIVED_FROM cycles", () => {
    const fixture = validAuthorityGraph();
    const other = stableId("AuthorityVersion", { authorityId: fixture.authority, versionLocator: "v2" });
    fixture.graph.nodes.push(envelope("AuthorityVersion", other, { attributes: { authorityId: fixture.authority } }));
    fixture.graph.edges.push(makeEdge("DERIVED_FROM", fixture.version, other));
    fixture.graph.edges.push(makeEdge("DERIVED_FROM", other, fixture.version));
    const result = validateGraph(fixture.graph);
    expect(result.issues.some((item) => item.code === "derived_from_cycle")).toBe(true);
  });

  it("rejects an accepted memo that includes an unresolved proposition", () => {
    const fixture = validAuthorityGraph();
    const unresolved = fixture.graph.nodes.find((node) => node.type === "Verdict");
    if (!unresolved) {
      throw new Error("missing verdict");
    }
    unresolved.attributes.verdict = "UNRESOLVED";
    unresolved.attributes.reviewerState = "accepted";
    const result = validateGraph(fixture.graph);
    expect(result.issues.some((item) => item.code === "memo_inadmissible_proposition")).toBe(true);
  });

  it("rejects authority nodes that omit data availability", () => {
    const fixture = validAuthorityGraph();
    const authority = fixture.graph.nodes.find((node) => node.type === "Authority");
    if (!authority) {
      throw new Error("missing authority");
    }
    delete authority.attributes.dataAvailability;
    const result = validateGraph(fixture.graph);
    expect(result.issues.some((item) => item.code === "implicit_unknown")).toBe(true);
  });
});
