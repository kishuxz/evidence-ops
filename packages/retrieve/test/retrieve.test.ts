import { describe, expect, it, vi } from "vitest";
import { OfflineIndex } from "../src/index.js";

function seedNearDuplicates(): OfflineIndex {
  const index = new OfflineIndex();
  index.add({
    id: "widget",
    caption: "Widget Co. v. Sprocket Ltd.",
    text: "The filing deadline is jurisdictional.",
    jurisdiction: "US-FED",
    date: "2020-01-01",
    versionLocator: "v1",
  });
  index.add({
    id: "widget-mfg",
    caption: "Widget Manufacturing v. Sprocket Parts",
    text: "Costs are awarded to the prevailing party.",
    jurisdiction: "US-FED",
    date: "2020-01-01",
    versionLocator: "v1",
  });
  return index;
}

describe("OfflineIndex", () => {
  it("ranks the matching caption first and flags near-duplicate risk", () => {
    const result = seedNearDuplicates().retrieve({
      text: "Widget Co. v. Sprocket Ltd. filing deadline",
      jurisdiction: "US-FED",
      citedDocumentId: "widget",
    });
    expect(result.hits[0]?.id).toBe("widget");
    expect(result.hits[0]?.snippet).toContain("jurisdictional");
    expect(result.hits.some((hit) => hit.id === "widget-mfg" && hit.wrongDocumentRisk)).toBe(true);
    expect(result.diagnostics.network).toBe(false);
    expect(result.diagnostics.liveCourtListener).toBe(false);
    expect(result.diagnostics.embedding).toBe("hashed-trigram");
  });

  it("filters by jurisdiction, date, and authority version", () => {
    const index = new OfflineIndex();
    index.add({
      id: "b",
      caption: "later",
      text: "alpha",
      jurisdiction: "US-FED",
      date: "2021-01-01",
      versionLocator: "v2",
    });
    index.add({
      id: "a",
      caption: "earlier",
      text: "alpha",
      jurisdiction: "US-STATE",
      date: "2019-01-01",
      versionLocator: "v1",
    });
    index.add({
      id: "c",
      caption: "in-window",
      text: "alpha",
      jurisdiction: "US-FED",
      date: "2020-06-01",
      versionLocator: "v1",
    });
    const byDate = index.retrieve({ text: "alpha", jurisdiction: "US-FED", asOf: "2020-12-31" });
    expect(byDate.hits.map((hit) => hit.id)).toEqual(["c"]);
    const byVersion = index.retrieve({ text: "alpha", versionLocator: "v2" });
    expect(byVersion.hits.map((hit) => hit.id)).toEqual(["b"]);
    expect(byVersion.diagnostics.filtersApplied.versionLocator).toBe(true);
    expect(byDate.diagnostics.filtered).toBe(2);
  });

  it("breaks hybrid ties by document id and is deterministic", () => {
    const index = new OfflineIndex();
    index.add({
      id: "z-doc",
      caption: "same",
      text: "identical body",
      jurisdiction: "US-FED",
      date: "2020-01-01",
      versionLocator: "v1",
    });
    index.add({
      id: "a-doc",
      caption: "same",
      text: "identical body",
      jurisdiction: "US-FED",
      date: "2020-01-01",
      versionLocator: "v1",
    });
    const first = index.retrieve({ text: "identical body" });
    const second = index.retrieve({ text: "identical body" });
    expect(first.hits.map((hit) => hit.id)).toEqual(["a-doc", "z-doc"]);
    expect(second.hits.map((hit) => hit.id)).toEqual(first.hits.map((hit) => hit.id));
    expect(first.diagnostics.tieBreak).toBe("hybrid-desc-then-id-asc");
  });

  it("does not call fetch or any network API", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    seedNearDuplicates().retrieve({ text: "Widget Co. filing deadline" });
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
