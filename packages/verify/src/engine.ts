import { loadCatalog } from "@evidenceops/contracts";

export const VERIFY_POLICY_VERSION = "verify.v1";

export type VerifyInput = {
  proposition: string;
  quotation: string;
  pinpoint: string;
  snapshotText: string;
  researchJurisdiction: string;
  authorityJurisdiction: string;
  authorityResolved: boolean;
  versionSuperseded: boolean;
  retrievedDocumentId: string | null;
  citedDocumentId: string | null;
  opposingQuotation?: string;
};

export type VerifyOutput = {
  verdict: string;
  reasonCodes: string[];
  method: "deterministic";
  policyVersion: string;
  quotationExact: boolean;
  pinpointPresent: boolean;
};

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function includesNormalized(haystack: string, needle: string): boolean {
  if (needle === "") {
    return false;
  }
  return normalize(haystack).includes(normalize(needle));
}

function extraPropositionClaims(proposition: string, quotation: string): boolean {
  const strip = (text: string) => normalize(text).toLowerCase().replace(/[.,;:"']/g, "");
  const prop = strip(proposition);
  const quote = strip(quotation);
  if (prop === quote || quote === "" || !prop.includes(quote)) {
    return false;
  }
  const remainder = prop.replace(quote, " ").replace(/\s+/g, " ").trim();
  return remainder.length > 0;
}

function closed(
  verdict: string,
  reasonCodes: string[],
  quotationExact: boolean,
  pinpointPresent: boolean,
): VerifyOutput {
  const catalog = loadCatalog();
  if (!catalog.verdicts.includes(verdict)) {
    throw new Error(`unknown verdict: ${verdict}`);
  }
  for (const code of reasonCodes) {
    if (!catalog.reasonCodes.includes(code)) {
      throw new Error(`unknown reason code: ${code}`);
    }
  }
  return {
    verdict,
    reasonCodes,
    method: "deterministic",
    policyVersion: VERIFY_POLICY_VERSION,
    quotationExact,
    pinpointPresent,
  };
}

export function verifyProposition(input: VerifyInput): VerifyOutput {
  const pinpointPresent = input.pinpoint.trim().length > 0;
  const quotationExact = includesNormalized(input.snapshotText, input.quotation);

  if (!input.authorityResolved) {
    return closed("NO_SUPPORT", ["fabricated_authority", "authority_identity_failed"], false, pinpointPresent);
  }
  if (
    input.retrievedDocumentId &&
    input.citedDocumentId &&
    input.retrievedDocumentId !== input.citedDocumentId
  ) {
    return closed("NO_SUPPORT", ["wrong_document", "authority_identity_failed"], quotationExact, pinpointPresent);
  }
  if (input.researchJurisdiction !== input.authorityJurisdiction) {
    return closed("WRONG_JURISDICTION", ["wrong_jurisdiction"], quotationExact, pinpointPresent);
  }
  if (input.versionSuperseded) {
    return closed("STALE_AUTHORITY", ["stale_authority"], quotationExact, pinpointPresent);
  }
  if (normalize(input.snapshotText) === "") {
    return closed("UNRESOLVED", ["unresolved_insufficient_evidence", "missing_connector_data"], false, pinpointPresent);
  }
  const opposing = input.opposingQuotation?.trim() ?? "";
  if (opposing !== "" && includesNormalized(input.snapshotText, opposing)) {
    return closed("CONTRADICTED", ["proposition_contradicted"], quotationExact, pinpointPresent);
  }
  if (!quotationExact) {
    return closed("NO_SUPPORT", ["quotation_mismatch", "pinpoint_failed"], false, pinpointPresent);
  }
  const propositionInPassage = includesNormalized(input.snapshotText, input.proposition);
  if (propositionInPassage) {
    return closed(
      "FULL_SUPPORT",
      ["authority_identity_verified", "quotation_exact", "pinpoint_verified", "proposition_full_support"],
      true,
      pinpointPresent,
    );
  }
  if (extraPropositionClaims(input.proposition, input.quotation) && quotationExact) {
    return closed("PARTIAL_SUPPORT", ["quotation_exact", "proposition_partial_support"], true, pinpointPresent);
  }
  return closed("NO_SUPPORT", ["proposition_no_support"], true, pinpointPresent);
}
