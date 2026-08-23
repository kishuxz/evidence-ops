import { describe, expect, it } from "vitest";
import { canonicalJson } from "../src/canonical.js";

describe("canonicalJson", () => {
  it("sorts object keys and omits whitespace", () => {
    expect(canonicalJson({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
    expect(canonicalJson({ a: { d: false, c: true } })).toBe('{"a":{"c":true,"d":false}}');
  });

  it("is stable when insertion order changes", () => {
    const left = canonicalJson({ slug: "acme", extra: "x" });
    const right = canonicalJson({ extra: "x", slug: "acme" });
    expect(left).toBe(right);
  });

  it("escapes controls and quotes", () => {
    expect(canonicalJson("a\"b\\c")).toBe('"a\\"b\\\\c"');
    expect(canonicalJson("a\nb")).toBe('"a\\u000ab"');
  });

  it("rejects unsafe numbers", () => {
    expect(() => canonicalJson(1.5)).toThrow(/safe integers/);
    expect(() => canonicalJson(Number.NaN)).toThrow(/safe integers/);
  });
});
