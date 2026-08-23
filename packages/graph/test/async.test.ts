import { describe, expect, it } from "vitest";
import { InMemoryGraphStore, runAsyncAdapterConformance, sampleSupportingGraph, syncToAsync } from "../src/index.js";

describe("async adapter wrapper", () => {
  it("matches the sync conformance suite", async () => {
    const fixture = sampleSupportingGraph("async");
    const failures = await runAsyncAdapterConformance(
      () => syncToAsync(new InMemoryGraphStore()),
      { scope: fixture.scope, graph: fixture.graph },
    );
    expect(failures).toEqual([]);
  });
});
