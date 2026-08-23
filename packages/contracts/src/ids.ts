import { createHash } from "node:crypto";
import { canonicalJson } from "./canonical.js";
import { SCHEMA_VERSION, nodeTypeDef } from "./catalog.js";

const ID_PATTERN = /^[a-z]{2,8}_[a-f0-9]{32}$/;

export type NaturalKey = Record<string, string | number>;

export function contentHash(bytes: Uint8Array | string): string {
  const hash = createHash("sha256");
  hash.update(typeof bytes === "string" ? Buffer.from(bytes, "utf8") : Buffer.from(bytes));
  return hash.digest("hex");
}

export function idPayload(typeName: string, key: NaturalKey): Record<string, unknown> {
  const def = nodeTypeDef(typeName);
  const ordered: NaturalKey = {};
  for (const field of def.naturalKey) {
    const value = key[field];
    if (value === undefined) {
      throw new Error(`natural key missing ${def.name}.${field}`);
    }
    ordered[field] = value;
  }
  const extra = Object.keys(key).filter((field) => !def.naturalKey.includes(field));
  if (extra.length > 0) {
    throw new Error(`natural key extra fields for ${def.name}: ${extra.join(",")}`);
  }
  return {
    key: ordered,
    schemaVersion: SCHEMA_VERSION,
    type: def.name,
  };
}

export function stableId(typeName: string, key: NaturalKey): string {
  const def = nodeTypeDef(typeName);
  const canonical = canonicalJson(idPayload(typeName, key));
  const digest = contentHash(canonical).slice(0, 32);
  return `${def.prefix}_${digest}`;
}

export function assertStableId(id: string): void {
  if (!ID_PATTERN.test(id)) {
    throw new Error(`invalid stable id: ${id}`);
  }
}

export function parsePrefix(id: string): string {
  assertStableId(id);
  const prefix = id.split("_")[0];
  if (!prefix) {
    throw new Error(`invalid stable id: ${id}`);
  }
  return prefix;
}
