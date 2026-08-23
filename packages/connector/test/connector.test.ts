import { describe, expect, it } from "vitest";
import { fixtureConformance } from "../src/conformance.js";
import { FixtureConnector } from "../src/fixture.js";
import { ImmutableSnapshotStore } from "../src/snapshots.js";

describe("fixture connector", () => {
  it("does not enable network or live CourtListener access", () => {
    const connector = new FixtureConnector();
    expect(connector.metadata.networkEnabled).toBe(false);
    expect(connector.metadata.liveCourtListener).toBe(false);
    expect(connector.metadata.coverage.toLowerCase()).toContain("synthetic");
  });

  it("returns explicit failure for missing and partial ingest", () => {
    const connector = new FixtureConnector();
    expect(connector.getSnapshot("missing").status).toBe("not_found");
    expect(connector.ingest(["fixture.widget.v1", "missing"]).status).toBe("partial_ingestion");
    expect(connector.getSnapshot("fixture.widget.v1").status).toBe("complete");
  });

  it("rejects snapshot hash replacement", () => {
    const store = new ImmutableSnapshotStore();
    const connector = new FixtureConnector();
    const snapshot = connector.getSnapshot("fixture.widget.v1").snapshot;
    if (!snapshot) {
      throw new Error("missing fixture snapshot");
    }
    store.put(snapshot);
    expect(() => store.put({ ...snapshot, contentHash: "a".repeat(64) })).toThrow(/immutable/);
  });

  it("passes offline conformance", () => {
    expect(fixtureConformance()).toEqual([]);
  });
});
