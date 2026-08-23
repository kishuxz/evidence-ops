import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { canonicalJson } from "../src/canonical.js";
import { contentHash, idPayload, stableId } from "../src/ids.js";
import { contractsRepoRoot } from "./specNames.js";

const CASES: { type: string; key: Record<string, string | number> }[] = [
  { type: "Tenant", key: { slug: "acme" } },
  { type: "Tenant", key: { slug: "café\"x" } },
  { type: "Jurisdiction", key: { code: "US-FED" } },
  { type: "Authority", key: { jurisdictionCode: "US-FED", citationKey: "410 U.S. 113" } },
  { type: "Matter", key: { tenantId: "ten_placeholder", slug: "chevron-research" } },
  { type: "LegalProposition", key: { matterId: "mat_placeholder", slug: "p1" } },
  { type: "Verdict", key: { researchRunId: "run_placeholder", propositionId: "prp_placeholder", sequence: 1 } },
];

function pythonBin(): string {
  const venv = join(contractsRepoRoot(), ".venv/bin/python");
  return existsSync(venv) ? venv : "python3";
}

function pythonStableId(typeName: string, key: Record<string, string | number>): string {
  const script = [
    "import json,sys",
    "from evidenceops.contracts import stable_id",
    "spec=json.loads(sys.argv[1])",
    "print(stable_id(spec['type'], spec['key']), end='')",
  ].join(";");
  return execFileSync(pythonBin(), ["-c", script, JSON.stringify({ type: typeName, key })], {
    encoding: "utf8",
    cwd: contractsRepoRoot(),
  });
}

describe("stable IDs", () => {
  it("is deterministic for the same natural key", () => {
    const first = stableId("Tenant", { slug: "acme" });
    const second = stableId("Tenant", { slug: "acme" });
    expect(first).toBe(second);
    expect(first).toMatch(/^ten_[a-f0-9]{32}$/);
  });

  it("changes when the natural key changes", () => {
    expect(stableId("Tenant", { slug: "acme" })).not.toBe(stableId("Tenant", { slug: "other" }));
  });

  it("uses canonical payloads so key insertion order cannot drift", () => {
    const left = canonicalJson(idPayload("Authority", { jurisdictionCode: "US-FED", citationKey: "x" }));
    const right = canonicalJson(idPayload("Authority", { citationKey: "x", jurisdictionCode: "US-FED" }));
    expect(left).toBe(right);
  });

  it("hashes snapshot bytes with SHA-256 hex", () => {
    expect(contentHash("hello")).toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
  });

  it("matches Python for shared natural keys", () => {
    for (const item of CASES) {
      expect(pythonStableId(item.type, item.key), item.type).toBe(stableId(item.type, item.key));
    }
  });
});
