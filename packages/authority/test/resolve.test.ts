import { describe, expect, it } from "vitest";
import { normalizeCitation } from "../src/normalize.js";
import { resolveCitation } from "../src/resolve.js";

describe("citation normalization", () => {
  it("is deterministic across spacing and punctuation", () => {
    const left = normalizeCitation("Widget Co. v. Sprocket Ltd., 1 Fix. 1 (Fict. Cir. 2020)");
    const right = normalizeCitation("1  FIX.   1 (2020)");
    expect(left?.citationKey).toBe("1 fix 1");
    expect(left?.citationKey).toBe(right?.citationKey);
  });

  it("resolves the fixture opinion and rejects fabricated reporters", () => {
    const hit = resolveCitation("Widget Co. v. Sprocket Ltd., 1 Fix. 1 (Fict. Cir. 2020)");
    expect(hit.status).toBe("resolved");
    expect(hit.snapshot?.id).toBe("fixture.widget.v1");
    expect(hit.authorityId?.startsWith("ath_")).toBe(true);
    const miss = resolveCitation("999 U.S. 999 (2099)");
    expect(miss.status).toBe("not_found");
    expect(miss.snapshot).toBeNull();
  });

  it("version resolution fails closed when the locator does not match", () => {
    const miss = resolveCitation("1 Fix. 1 (2020)", undefined, "v9");
    expect(miss.status).toBe("not_found");
    const hit = resolveCitation("1 Fix. 1 (2020)", undefined, "v1");
    expect(hit.status).toBe("resolved");
  });
});
