import { loadCatalog, nodeTypeDef, type NodeTypeDef } from "./catalog.js";
import { assertStableId, parsePrefix, stableId, type NaturalKey } from "./ids.js";

export type EvidenceEnvelope = {
  schemaVersion: number;
  type: string;
  id: string;
  tenantId: string | null;
  matterId: string | null;
  sourceLocator: string | null;
  retrievedAt: string | null;
  contentHash: string | null;
  redaction: string;
};

export type VerdictRecord = {
  schemaVersion: number;
  id: string;
  tenantId: string;
  matterId: string;
  propositionId: string;
  verdict: string;
  reasonCodes: string[];
  method: string;
  policyVersion: string;
  evidenceIds: string[];
  modelVersion: string | null;
  retrieverVersion: string | null;
  reviewerState: string;
};

const RFC3339 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const SHA256_HEX = /^[a-f0-9]{64}$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(record: Record<string, unknown>, field: string): string {
  const value = record[field];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function optionalString(record: Record<string, unknown>, field: string): string | null {
  const value = record[field];
  if (value === null) {
    return null;
  }
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${field} must be a string or null`);
  }
  return value;
}

function checkScope(def: NodeTypeDef, tenantId: string | null, matterId: string | null, id: string): void {
  if (def.scope === "tenant_matter") {
    if (!tenantId || !matterId) {
      throw new Error(`${def.name} requires tenantId and matterId`);
    }
  }
  if (def.scope === "tenant") {
    if (!tenantId) {
      throw new Error(`${def.name} requires tenantId`);
    }
    if (matterId !== null && def.name !== "Matter") {
      throw new Error(`${def.name} must not set matterId`);
    }
  }
  if (def.name === "Tenant" && tenantId !== id) {
    throw new Error("Tenant.tenantId must equal id");
  }
  if (def.name === "Matter") {
    if (matterId !== id) {
      throw new Error("Matter.matterId must equal id");
    }
  }
}

export function validateEnvelope(
  value: unknown,
  naturalKey?: NaturalKey,
): EvidenceEnvelope {
  if (!isObject(value)) {
    throw new Error("envelope must be an object");
  }
  const catalog = loadCatalog();
  if (value.schemaVersion !== catalog.schemaVersion) {
    throw new Error("unsupported schemaVersion");
  }
  const type = requiredString(value, "type");
  const def = nodeTypeDef(type);
  const id = requiredString(value, "id");
  assertStableId(id);
  if (parsePrefix(id) !== def.prefix) {
    throw new Error(`id prefix must be ${def.prefix} for ${type}`);
  }
  if (naturalKey) {
    const expected = stableId(type, naturalKey);
    if (id !== expected) {
      throw new Error("id does not match natural key");
    }
  }
  const tenantId = optionalString(value, "tenantId");
  const matterId = optionalString(value, "matterId");
  checkScope(def, tenantId, matterId, id);
  const redaction = requiredString(value, "redaction");
  if (!catalog.redactionClassifications.includes(redaction)) {
    throw new Error(`unknown redaction: ${redaction}`);
  }
  const contentHash = optionalString(value, "contentHash");
  if (contentHash && !SHA256_HEX.test(contentHash)) {
    throw new Error("contentHash must be 64 lowercase hex chars");
  }
  const retrievedAt = optionalString(value, "retrievedAt");
  if (retrievedAt && !RFC3339.test(retrievedAt)) {
    throw new Error("retrievedAt must be RFC3339 UTC");
  }
  const sourceLocator = optionalString(value, "sourceLocator");
  return {
    schemaVersion: catalog.schemaVersion,
    type,
    id,
    tenantId,
    matterId,
    sourceLocator,
    retrievedAt,
    contentHash,
    redaction,
  };
}

export function validateVerdictRecord(value: unknown): VerdictRecord {
  if (!isObject(value)) {
    throw new Error("verdict must be an object");
  }
  const catalog = loadCatalog();
  const envelopeish = {
    schemaVersion: value.schemaVersion,
    type: "Verdict",
    id: value.id,
    tenantId: value.tenantId,
    matterId: value.matterId,
    sourceLocator: null,
    retrievedAt: null,
    contentHash: null,
    redaction: value.redaction ?? "internal",
  };
  validateEnvelope(envelopeish);
  const verdict = requiredString(value, "verdict");
  if (!catalog.verdicts.includes(verdict)) {
    throw new Error(`unknown verdict: ${verdict}`);
  }
  const method = requiredString(value, "method");
  if (!catalog.verdictMethods.includes(method)) {
    throw new Error(`unknown method: ${method}`);
  }
  const reviewerState = requiredString(value, "reviewerState");
  if (!catalog.reviewerStates.includes(reviewerState)) {
    throw new Error(`unknown reviewerState: ${reviewerState}`);
  }
  const reasonCodes = value.reasonCodes;
  if (!Array.isArray(reasonCodes) || reasonCodes.some((code) => typeof code !== "string")) {
    throw new Error("reasonCodes must be strings");
  }
  for (const code of reasonCodes) {
    if (!catalog.reasonCodes.includes(code)) {
      throw new Error(`unknown reason code: ${code}`);
    }
  }
  const evidenceIds = value.evidenceIds;
  if (!Array.isArray(evidenceIds) || evidenceIds.some((id) => typeof id !== "string")) {
    throw new Error("evidenceIds must be strings");
  }
  for (const id of evidenceIds) {
    assertStableId(id);
  }
  return {
    schemaVersion: catalog.schemaVersion,
    id: requiredString(value, "id"),
    tenantId: requiredString(value, "tenantId"),
    matterId: requiredString(value, "matterId"),
    propositionId: requiredString(value, "propositionId"),
    verdict,
    reasonCodes,
    method,
    policyVersion: requiredString(value, "policyVersion"),
    evidenceIds,
    modelVersion: optionalString(value, "modelVersion"),
    retrieverVersion: optionalString(value, "retrieverVersion"),
    reviewerState,
  };
}

export function propositionAdmissibleInMemo(verdict: string, reviewerState: string): boolean {
  const catalog = loadCatalog();
  if (!catalog.verdicts.includes(verdict)) {
    return false;
  }
  if (reviewerState !== "accepted") {
    return false;
  }
  return verdict !== "UNRESOLVED" && verdict !== "NO_SUPPORT";
}
