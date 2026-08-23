import { createHash } from "node:crypto";
import { CORPUS, corpusManifest, sha256Text, validateEvalCase, type EvalCase } from "@evidenceops/eval";

export const INSTRUCTIONS = `Review each case independently. Do not treat the system as legal advice.
Record your verdict using only FULL_SUPPORT, PARTIAL_SUPPORT, NO_SUPPORT, CONTRADICTED,
WRONG_JURISDICTION, STALE_AUTHORITY, or UNRESOLVED. UNRESOLVED is allowed; do not guess.
Cases are synthetic constructed engineering fixtures, not CourtListener data.`;

export const RUBRIC = {
  FULL_SUPPORT: "Quoted passage appears in the snapshot and supports the whole proposition.",
  PARTIAL_SUPPORT: "Quotation is supported but the proposition adds unsupported claims.",
  NO_SUPPORT: "Real or fabricated authority does not support the proposition, or the quotation is wrong.",
  CONTRADICTED: "Snapshot contains an opposing quotation.",
  WRONG_JURISDICTION: "Authority jurisdiction does not match the research jurisdiction.",
  STALE_AUTHORITY: "Snapshot is superseded or otherwise temporally invalid.",
  UNRESOLVED: "Evidence is insufficient; do not invent support.",
};

export const CONFLICT_POLICY = `If two qualified reviewers disagree, keep the case independentReview=false,
record the disagreement, and do not silently change evaluation labels. A third reviewer
or an explicit later import node is required before any corpus field flip.`;

export type ReviewerIdentity = {
  reviewerId: string;
  fullName: string;
  qualifications: string;
  barAdmission: string | null;
  jurisdictionExpertise: string[];
  independent: boolean;
};

export type BlindedCase = {
  id: string;
  proposition: string;
  citation: EvalCase["citation"];
  snapshot: { id: string; locator: string; contentHash: string; text: string };
  jurisdiction: string;
  origin: "synthetic";
  sourceKind: "constructed";
  independentReview: false;
  reviewStatus: "engineering_fixture_awaiting_expert_review";
  expectedVerdictBlinded: string;
  reviewerRationale: string;
};

export type CompletedReview = {
  caseId: string;
  verdict: string;
  rationale: string;
  reviewerId: string;
};

export type ReviewManifest = {
  corpusId: string;
  corpusHash: string;
  caseCount: number;
  caseHashes: Record<string, string>;
  createdAt: string;
  signature: string;
  notes: string;
};

export type ReviewPackage = {
  instructions: string;
  rubric: typeof RUBRIC;
  conflictPolicy: string;
  identityFields: (keyof ReviewerIdentity)[];
  cases: BlindedCase[];
  manifest: ReviewManifest;
};

function blind(caseId: string, verdict: string): string {
  return createHash("sha256").update(`blind:${caseId}:${verdict}`, "utf8").digest("hex");
}

export function corpusHash(cases: EvalCase[]): string {
  const joined = cases.map((item) => `${item.id}:${item.snapshot.contentHash}`).join("\n");
  return sha256Text(joined);
}

export function signManifest(payload: Omit<ReviewManifest, "signature">): string {
  return sha256Text(JSON.stringify(payload));
}

export function buildReviewPackage(cases: EvalCase[] = CORPUS): ReviewPackage {
  const blinded: BlindedCase[] = cases.map((item) => {
    validateEvalCase(item);
    return {
      id: item.id,
      proposition: item.proposition,
      citation: item.citation,
      snapshot: {
        id: item.snapshot.id,
        locator: item.snapshot.locator,
        contentHash: item.snapshot.contentHash,
        text: item.snapshot.text,
      },
      jurisdiction: item.jurisdiction,
      origin: "synthetic",
      sourceKind: "constructed",
      independentReview: false,
      reviewStatus: "engineering_fixture_awaiting_expert_review",
      expectedVerdictBlinded: blind(item.id, item.expectedVerdict),
      reviewerRationale: "",
    };
  });
  const caseHashes: Record<string, string> = {};
  for (const item of cases) {
    caseHashes[item.id] = item.snapshot.contentHash;
  }
  const unsigned = {
    corpusId: corpusManifest().corpusId,
    corpusHash: corpusHash(cases),
    caseCount: cases.length,
    caseHashes,
    createdAt: "2026-08-22T00:00:00Z",
    notes: "Engineering fixtures awaiting expert review. This package is not completed expert review.",
  };
  return {
    instructions: INSTRUCTIONS,
    rubric: RUBRIC,
    conflictPolicy: CONFLICT_POLICY,
    identityFields: [
      "reviewerId",
      "fullName",
      "qualifications",
      "barAdmission",
      "jurisdictionExpertise",
      "independent",
    ],
    cases: blinded,
    manifest: { ...unsigned, signature: signManifest(unsigned) },
  };
}

export function verifyManifest(pkg: ReviewPackage): boolean {
  const { signature, ...rest } = pkg.manifest;
  return signature === signManifest(rest);
}

export function importCompletedReviews(
  pkg: ReviewPackage,
  identities: ReviewerIdentity[],
  reviews: CompletedReview[],
): {
  accepted: number;
  disagreements: { caseId: string; verdicts: string[] }[];
  independentReviewRemainsFalse: true;
  originRemainsSynthetic: true;
} {
  if (!verifyManifest(pkg)) {
    throw new Error("review manifest signature mismatch");
  }
  if (identities.length === 0 || identities.some((item) => item.reviewerId === "" || item.qualifications === "")) {
    throw new Error("reviewer identity and qualifications are required");
  }
  const byCase = new Map<string, string[]>();
  for (const review of reviews) {
    if (!pkg.cases.some((item) => item.id === review.caseId)) {
      throw new Error(`unknown case ${review.caseId}`);
    }
    if (!identities.some((item) => item.reviewerId === review.reviewerId)) {
      throw new Error(`unknown reviewer ${review.reviewerId}`);
    }
    if (review.rationale.trim() === "") {
      throw new Error(`rationale required for ${review.caseId}`);
    }
    const list = byCase.get(review.caseId) ?? [];
    list.push(review.verdict);
    byCase.set(review.caseId, list);
  }
  const disagreements: { caseId: string; verdicts: string[] }[] = [];
  for (const [caseId, verdicts] of byCase) {
    if (new Set(verdicts).size > 1) {
      disagreements.push({ caseId, verdicts });
    }
  }
  return {
    accepted: reviews.length,
    disagreements,
    independentReviewRemainsFalse: true,
    originRemainsSynthetic: true,
  };
}

export function cohensKappa(left: CompletedReview[], right: CompletedReview[]): {
  kappa: number;
  pairs: number;
  disagreements: { caseId: string; left: string; right: string }[];
} {
  const rightById = new Map(right.map((item) => [item.caseId, item]));
  const disagreements: { caseId: string; left: string; right: string }[] = [];
  let agree = 0;
  let pairs = 0;
  const labels = new Set<string>();
  for (const item of left) {
    const other = rightById.get(item.caseId);
    if (!other) {
      continue;
    }
    pairs += 1;
    labels.add(item.verdict);
    labels.add(other.verdict);
    if (item.verdict === other.verdict) {
      agree += 1;
    } else {
      disagreements.push({ caseId: item.caseId, left: item.verdict, right: other.verdict });
    }
  }
  if (pairs === 0) {
    return { kappa: 0, pairs: 0, disagreements };
  }
  const p0 = agree / pairs;
  const pe = 1 / Math.max(labels.size, 1);
  const denom = 1 - pe;
  const kappa = denom === 0 ? 1 : (p0 - pe) / denom;
  return { kappa, pairs, disagreements };
}
