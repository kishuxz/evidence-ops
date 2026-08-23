import type { SourceConnector } from "./types.js";
import { FixtureConnector } from "./fixture.js";
import { ImmutableSnapshotStore } from "./snapshots.js";

export type ConformanceFailure = { name: string; message: string };

export function runConnectorConformance(connector: SourceConnector): ConformanceFailure[] {
  const failures: ConformanceFailure[] = [];
  const check = (name: string, fn: () => void): void => {
    try {
      fn();
    } catch (error) {
      failures.push({ name, message: error instanceof Error ? error.message : String(error) });
    }
  };
  check("offline only", () => {
    if (connector.metadata.networkEnabled !== false || connector.metadata.liveCourtListener !== false) {
      throw new Error("networked or live CourtListener connector is forbidden");
    }
    if (connector.metadata.mode !== "fixture") {
      throw new Error("only fixture mode is authorized");
    }
  });
  check("unknown id is not success", () => {
    const result = connector.getSnapshot("does-not-exist");
    if (result.status === "complete") {
      throw new Error("missing snapshot must not be complete");
    }
  });
  check("partial ingestion is explicit", () => {
    const result = connector.ingest(["fixture.widget.v1", "missing"]);
    if (result.status !== "partial_ingestion") {
      throw new Error(`expected partial_ingestion, got ${result.status}`);
    }
  });
  return failures;
}

export function fixtureConformance(): ConformanceFailure[] {
  return runConnectorConformance(new FixtureConnector());
}

export { ImmutableSnapshotStore };
