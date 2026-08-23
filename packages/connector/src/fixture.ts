import { createHash } from "node:crypto";
import type { ConnectorMetadata, Snapshot, SnapshotResult, SourceConnector } from "./types.js";

export function snapshotHash(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export const FIXTURE_METADATA: ConnectorMetadata = {
  id: "fixture.synthetic.federal-opinions",
  mode: "fixture",
  license: "original-synthetic-text; Apache-2.0 repository; not CourtListener data",
  coverage: "offline synthetic federal-style opinions for tests only",
  rateLimit: "unlimited offline; no network",
  redistribution: "authored for EvidenceOps fixtures; not live court data",
  networkEnabled: false,
  liveCourtListener: false,
};

const WIDGET_TEXT =
  "Widget Co. v. Sprocket Ltd., 1 Fix. 1 (Fict. Cir. 2020)\nThe filing deadline is jurisdictional.";

export const FIXTURE_SNAPSHOTS: Snapshot[] = [
  {
    id: "fixture.widget.v1",
    versionLocator: "v1",
    contentHash: snapshotHash(WIDGET_TEXT),
    text: WIDGET_TEXT,
    retrievedAt: "2026-01-01T00:00:00Z",
    sourceId: "fixture.synthetic.federal-opinions",
  },
];

export class FixtureConnector implements SourceConnector {
  readonly metadata = FIXTURE_METADATA;
  private readonly byId = new Map(FIXTURE_SNAPSHOTS.map((item) => [item.id, item]));

  getSnapshot(id: string): SnapshotResult {
    const snapshot = this.byId.get(id) ?? null;
    if (!snapshot) {
      return { status: "not_found", snapshot: null, missingIds: [id] };
    }
    return { status: "complete", snapshot, missingIds: [] };
  }

  ingest(ids: string[]): SnapshotResult {
    const missing = ids.filter((id) => !this.byId.has(id));
    if (missing.length === ids.length) {
      return { status: "not_found", snapshot: null, missingIds: missing };
    }
    if (missing.length > 0) {
      const found = ids.find((id) => this.byId.has(id));
      return {
        status: "partial_ingestion",
        snapshot: found ? this.byId.get(found) ?? null : null,
        missingIds: missing,
      };
    }
    return { status: "complete", snapshot: this.byId.get(ids[0] ?? "") ?? null, missingIds: [] };
  }
}
