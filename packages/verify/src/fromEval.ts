import type { EvalCase } from "@evidenceops/eval";
import type { VerifyInput } from "./engine.js";

/**
 * Fixture adapter only. Production callers must supply identity flags from
 * retrieval and citation resolution, not from eval category labels.
 */
export function verifyInputFromEvalCase(item: EvalCase): VerifyInput {
  const fabricated = item.category === "fabricated_authority";
  const stale = item.category === "stale_authority" || item.snapshot.text.includes("SUPERSEDED");
  const wrongDocument = item.category === "wrong_document";
  const wrongJurisdiction = item.category === "wrong_jurisdiction";
  return {
    proposition: item.proposition,
    quotation: item.citation.quotation,
    pinpoint: item.citation.pinpoint,
    snapshotText: item.snapshot.text,
    researchJurisdiction: item.jurisdiction,
    authorityJurisdiction: wrongJurisdiction ? "US-STATE-FICT" : item.jurisdiction,
    authorityResolved: !fabricated,
    versionSuperseded: stale,
    retrievedDocumentId: wrongDocument ? `${item.snapshot.id}.retrieved-other` : item.snapshot.id,
    citedDocumentId: item.snapshot.id,
  };
}
