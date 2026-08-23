export type ConnectorMode = "fixture";

export type IngestionStatus = "complete" | "partial_ingestion" | "not_found" | "deleted_source" | "offline_only";

export type ConnectorMetadata = {
  id: string;
  mode: ConnectorMode;
  license: string;
  coverage: string;
  rateLimit: string;
  redistribution: string;
  networkEnabled: false;
  liveCourtListener: false;
};

export type Snapshot = {
  id: string;
  versionLocator: string;
  contentHash: string;
  text: string;
  retrievedAt: string;
  sourceId: string;
};

export type SnapshotResult = {
  status: IngestionStatus;
  snapshot: Snapshot | null;
  missingIds: string[];
};

export interface SourceConnector {
  readonly metadata: ConnectorMetadata;
  getSnapshot(id: string): SnapshotResult;
  ingest(ids: string[]): SnapshotResult;
}

export type ConnectorIssue = { code: string; message: string };
