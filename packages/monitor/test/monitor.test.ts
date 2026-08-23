import { ApprovalPolicy, AuthError } from "@evidenceops/auth";
import { InMemoryGraphStore, makeEdge, sampleSupportingGraph } from "@evidenceops/graph";
import { describe, expect, it } from "vitest";
import {
  applyAcceptedConclusion,
  classifyChange,
  monitorAuthorityVersion,
  redline,
} from "../src/index.js";

describe("authority monitoring", () => {
  it("classifies none, meaningful, and supersession changes", () => {
    expect(classifyChange("a", "a")).toBe("none");
    expect(classifyChange("paper filing is required", "electronic filing is required")).toBe("meaningful");
    expect(classifyChange("paper filing is required", "SUPERSEDED: electronic filing is required")).toBe(
      "supersession",
    );
  });

  it("walks direct and transitive impact onto propositions and memos", () => {
    const fixture = sampleSupportingGraph("monitor");
    fixture.graph.edges.push(
      makeEdge("INVALIDATES", fixture.version, fixture.proposition, {
        tenantId: fixture.tenant,
        matterId: fixture.matter,
        impactKind: "direct",
      }),
      makeEdge("INVALIDATES", fixture.version, fixture.memo, {
        tenantId: fixture.tenant,
        matterId: fixture.matter,
        impactKind: "transitive",
      }),
    );
    const store = new InMemoryGraphStore();
    expect(store.importGraph(fixture.scope, fixture.graph).ok).toBe(true);
    const result = monitorAuthorityVersion(store, fixture.scope, fixture.version);
    expect(result.affected.propositions).toContain(fixture.proposition);
    expect(result.affected.memos).toContain(fixture.memo);
    expect(redline("old", "new").changeClass).toBe("meaningful");
  });

  it("refuses to change an accepted conclusion without human approval", () => {
    const fixture = sampleSupportingGraph("approve");
    const conclusion = fixture.graph.nodes.find((node) => node.type === "Conclusion");
    if (!conclusion) {
      throw new Error("missing conclusion");
    }
    conclusion.attributes.status = "accepted";
    const approvals = new ApprovalPolicy();
    const principal = { userId: "usr_1", tenantId: fixture.tenant, roles: ["reviewer" as const] };
    expect(() =>
      applyAcceptedConclusion(fixture.graph, conclusion.id, "new holding", approvals, principal, fixture.matter),
    ).toThrow(AuthError);
    approvals.record(principal, fixture.matter, "publish", "2026-08-22T00:00:00Z");
    const updated = applyAcceptedConclusion(
      fixture.graph,
      conclusion.id,
      "new holding",
      approvals,
      principal,
      fixture.matter,
    );
    expect(updated.nodes.find((node) => node.id === conclusion.id)?.attributes.text).toBe("new holding");
  });
});
