import { ApprovalPolicy, AuthError, type Principal } from "@evidenceops/auth";
import {
  type EvidenceGraph,
  type GraphStore,
  type StoreScope,
  type Trace,
} from "@evidenceops/graph";

export type ChangeClass = "none" | "meaningful" | "supersession";

export type Redline = {
  previous: string;
  next: string;
  changeClass: ChangeClass;
};

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function classifyChange(previous: string, next: string): ChangeClass {
  if (normalize(previous) === normalize(next)) {
    return "none";
  }
  if (/\bSUPERSEDED\b|\boverrul/i.test(next) && !/\bSUPERSEDED\b/i.test(previous)) {
    return "supersession";
  }
  return "meaningful";
}

export function redline(previous: string, next: string): Redline {
  return { previous, next, changeClass: classifyChange(previous, next) };
}

export function affectedFromImpact(trace: Trace): { propositions: string[]; memos: string[] } {
  const propositions = trace.steps.filter((step) => step.type === "LegalProposition").map((step) => step.nodeId);
  const memos = trace.steps.filter((step) => step.type === "Memo").map((step) => step.nodeId);
  return { propositions, memos };
}

export function monitorAuthorityVersion(
  store: GraphStore,
  scope: StoreScope,
  versionId: string,
): { impact: Trace; affected: ReturnType<typeof affectedFromImpact> } {
  const impact = store.changeImpact(scope, versionId);
  return { impact, affected: affectedFromImpact(impact) };
}

export function applyAcceptedConclusion(
  graph: EvidenceGraph,
  conclusionId: string,
  nextText: string,
  approvals: ApprovalPolicy,
  principal: Principal,
  matterId: string,
): EvidenceGraph {
  const node = graph.nodes.find((item) => item.id === conclusionId);
  if (!node || node.type !== "Conclusion") {
    throw new Error("conclusion not found");
  }
  if (node.attributes.status === "accepted" || node.attributes.reviewerState === "accepted") {
    try {
      approvals.require(principal.tenantId, matterId, "publish");
    } catch (error) {
      const message = error instanceof AuthError ? error.message : String(error);
      throw new AuthError(`accepted conclusions cannot change without approval: ${message}`);
    }
  }
  return {
    ...graph,
    nodes: graph.nodes.map((item) =>
      item.id === conclusionId
        ? { ...item, attributes: { ...item.attributes, text: nextText, pendingReview: true } }
        : item,
    ),
  };
}
