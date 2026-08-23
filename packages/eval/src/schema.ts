import { createHash } from "node:crypto";

export const EVAL_SCHEMA_VERSION = 1;

export const CASE_CATEGORIES = [
  "full_support",
  "partial_support",
  "no_support",
  "fabricated_authority",
  "wrong_quotation",
  "wrong_jurisdiction",
  "stale_authority",
  "wrong_document",
] as const;

export type CaseCategory = (typeof CASE_CATEGORIES)[number];

export const CATEGORY_VERDICT: Record<CaseCategory, string> = {
  full_support: "FULL_SUPPORT",
  partial_support: "PARTIAL_SUPPORT",
  no_support: "NO_SUPPORT",
  fabricated_authority: "NO_SUPPORT",
  wrong_quotation: "NO_SUPPORT",
  wrong_jurisdiction: "WRONG_JURISDICTION",
  stale_authority: "STALE_AUTHORITY",
  wrong_document: "NO_SUPPORT",
};

export type EvalSnapshot = {
  id: string;
  locator: string;
  contentHash: string;
  text: string;
  redistribution: string;
  notLiveCourtListener: true;
};

export type EvalAnnotation = {
  rationale: string;
  reviewerId: string;
  reviewerVersion: string;
  annotatedAt: string;
};

export type EvalCase = {
  schemaVersion: number;
  id: string;
  category: CaseCategory;
  expectedVerdict: string;
  jurisdiction: string;
  proposition: string;
  citation: { raw: string; pinpoint: string; quotation: string };
  snapshot: EvalSnapshot;
  annotation: EvalAnnotation;
  privileged: false;
};

export type CorpusManifest = {
  schemaVersion: number;
  corpusId: string;
  notes: string;
  targetCounts: Record<CaseCategory, number>;
  actualCounts: Record<string, number>;
};

export const TARGET_COUNTS: Record<CaseCategory, number> = {
  full_support: 50,
  partial_support: 30,
  no_support: 30,
  fabricated_authority: 20,
  wrong_quotation: 20,
  wrong_jurisdiction: 20,
  stale_authority: 15,
  wrong_document: 15,
};

export function sha256Text(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateEvalCase(value: unknown): EvalCase {
  if (!isRecord(value)) {
    throw new Error("eval case must be an object");
  }
  if (value.schemaVersion !== EVAL_SCHEMA_VERSION) {
    throw new Error("unsupported eval schemaVersion");
  }
  if (value.privileged === true) {
    throw new Error("privileged fixtures are forbidden");
  }
  if (value.privileged !== false) {
    throw new Error("privileged must be explicitly false");
  }
  const category = value.category;
  if (typeof category !== "string" || !CASE_CATEGORIES.includes(category as CaseCategory)) {
    throw new Error(`unknown category: ${String(category)}`);
  }
  const expectedVerdict = String(value.expectedVerdict ?? "");
  if (expectedVerdict !== CATEGORY_VERDICT[category as CaseCategory]) {
    throw new Error(`expectedVerdict must be ${CATEGORY_VERDICT[category as CaseCategory]} for ${category}`);
  }
  if (!isRecord(value.snapshot)) {
    throw new Error("snapshot required");
  }
  if (value.snapshot.notLiveCourtListener !== true) {
    throw new Error("snapshot must declare notLiveCourtListener");
  }
  const text = String(value.snapshot.text ?? "");
  const contentHash = String(value.snapshot.contentHash ?? "");
  if (!/^[a-f0-9]{64}$/.test(contentHash)) {
    throw new Error("snapshot contentHash must be sha256 hex");
  }
  if (sha256Text(text) !== contentHash) {
    throw new Error("snapshot contentHash does not match text");
  }
  if (!isRecord(value.annotation)) {
    throw new Error("annotation provenance required");
  }
  for (const field of ["rationale", "reviewerId", "reviewerVersion", "annotatedAt"]) {
    if (typeof value.annotation[field] !== "string" || value.annotation[field] === "") {
      throw new Error(`annotation.${field} required`);
    }
  }
  if (!isRecord(value.citation)) {
    throw new Error("citation required");
  }
  return value as EvalCase;
}

export function countByCategory(cases: EvalCase[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const category of CASE_CATEGORIES) {
    counts[category] = 0;
  }
  for (const item of cases) {
    counts[item.category] = (counts[item.category] ?? 0) + 1;
  }
  return counts;
}
