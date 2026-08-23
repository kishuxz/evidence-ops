import { stableId } from "@evidenceops/contracts";
import { FixtureConnector, type Snapshot } from "@evidenceops/connector";
import { normalizeCitation } from "./normalize.js";

export type AuthorityResolution = {
  status: "resolved" | "not_found";
  citationKey: string | null;
  authorityId: string | null;
  snapshot: Snapshot | null;
};

const INDEX: Record<string, string> = {
  "1 fix 1": "fixture.widget.v1",
};

export function resolveCitation(
  raw: string,
  connector: FixtureConnector = new FixtureConnector(),
  asOfVersion?: string,
): AuthorityResolution {
  const normalized = normalizeCitation(raw);
  if (!normalized) {
    return { status: "not_found", citationKey: null, authorityId: null, snapshot: null };
  }
  const snapshotId = INDEX[normalized.citationKey];
  if (!snapshotId) {
    return { status: "not_found", citationKey: normalized.citationKey, authorityId: null, snapshot: null };
  }
  const fetched = connector.getSnapshot(snapshotId);
  if (fetched.status !== "complete" || !fetched.snapshot) {
    return { status: "not_found", citationKey: normalized.citationKey, authorityId: null, snapshot: null };
  }
  if (asOfVersion && fetched.snapshot.versionLocator !== asOfVersion) {
    return { status: "not_found", citationKey: normalized.citationKey, authorityId: null, snapshot: null };
  }
  const authorityId = stableId("Authority", {
    jurisdictionCode: "US-FED",
    citationKey: normalized.citationKey,
  });
  return { status: "resolved", citationKey: normalized.citationKey, authorityId, snapshot: fetched.snapshot };
}
