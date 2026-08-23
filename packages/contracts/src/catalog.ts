import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const SCHEMA_VERSION = 1;
export const SCHEMA_ID = "evidenceops.contracts.v1";

export type Scope = "none" | "tenant" | "tenant_matter";

export type NodeTypeDef = {
  name: string;
  prefix: string;
  scope: Scope;
  naturalKey: string[];
};

export type Catalog = {
  schemaVersion: number;
  schemaId: string;
  verdicts: string[];
  reviewerStates: string[];
  redactionClassifications: string[];
  dataAvailability: string[];
  verdictMethods: string[];
  impactKinds: string[];
  reasonCodes: string[];
  nodeTypes: NodeTypeDef[];
  edgeTypes: string[];
};

let cached: Catalog | undefined;

export function catalogPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, "../schemas/v1/catalog.json");
}

export function loadCatalog(): Catalog {
  if (cached) {
    return cached;
  }
  const parsed: unknown = JSON.parse(readFileSync(catalogPath(), "utf8"));
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("catalog: invalid JSON");
  }
  cached = parsed as Catalog;
  if (cached.schemaVersion !== SCHEMA_VERSION) {
    throw new Error("catalog: unexpected schemaVersion");
  }
  return cached;
}

export function nodeTypeDef(name: string): NodeTypeDef {
  const def = loadCatalog().nodeTypes.find((item) => item.name === name);
  if (!def) {
    throw new Error(`unknown node type: ${name}`);
  }
  return def;
}
