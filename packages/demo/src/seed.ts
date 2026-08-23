import { sampleSupportingGraph } from "@evidenceops/graph";

export const DEMO_SLUG = "demo";
export const DEMO_ADMIN_TOKEN = "demo-admin-local-only";
export const DEMO_REVIEWER_TOKEN = "demo-reviewer-local-only";
export const DEMO_RESET_CONFIRM = "demo-data-only";
export const DEMO_BIND = "127.0.0.1";
export const DEMO_PORT = 8787;

const sample = sampleSupportingGraph(DEMO_SLUG);

export const DEMO_SEED = {
  tenantId: sample.tenant,
  matterId: sample.matter,
  propositionId: sample.proposition,
  versionId: sample.version,
  memoId: sample.memo,
  conclusionId: sample.conclusion,
  graph: sample.graph,
  proposition: "The filing deadline is jurisdictional.",
  quotation: "The filing deadline is jurisdictional.",
  pinpoint: "1 Fix. at 3",
  citation: "Widget Co. v. Sprocket Ltd., 1 Fix. 1 (Fict. Cir. 2020)",
  snapshotId: "fixture.widget.v1",
  previousAuthority: "The filing deadline is jurisdictional.",
  nextAuthority: "The filing deadline is jurisdictional. SUPERSEDED: electronic filing is now mandatory.",
};
