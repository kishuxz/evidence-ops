import { describe, expect, it } from "vitest";
import { stableId } from "../src/ids.js";
import {
  propositionAdmissibleInMemo,
  validateEnvelope,
  validateVerdictRecord,
} from "../src/validate.js";

describe("envelope validation", () => {
  it("requires tenant and matter on proposition records", () => {
    const id = stableId("LegalProposition", { matterId: "mat_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", slug: "p1" });
    expect(() =>
      validateEnvelope({
        schemaVersion: 1,
        type: "LegalProposition",
        id,
        tenantId: null,
        matterId: null,
        sourceLocator: null,
        retrievedAt: null,
        contentHash: null,
        redaction: "public",
      }),
    ).toThrow(/tenantId and matterId/);
  });

  it("accepts a well-formed tenant envelope whose id matches the natural key", () => {
    const id = stableId("Tenant", { slug: "acme" });
    const envelope = validateEnvelope(
      {
        schemaVersion: 1,
        type: "Tenant",
        id,
        tenantId: id,
        matterId: null,
        sourceLocator: null,
        retrievedAt: null,
        contentHash: null,
        redaction: "public",
      },
      { slug: "acme" },
    );
    expect(envelope.id).toBe(id);
  });

  it("rejects a mismatched natural key", () => {
    const id = stableId("Tenant", { slug: "acme" });
    expect(() =>
      validateEnvelope(
        {
          schemaVersion: 1,
          type: "Tenant",
          id,
          tenantId: id,
          matterId: null,
          sourceLocator: null,
          retrievedAt: null,
          contentHash: null,
          redaction: "public",
        },
        { slug: "other" },
      ),
    ).toThrow(/natural key/);
  });
});

describe("verdict records", () => {
  it("requires an explicit catalog verdict and reviewer state", () => {
    const id = stableId("Verdict", {
      researchRunId: "run_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      propositionId: "prp_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      sequence: 1,
    });
    const record = validateVerdictRecord({
      schemaVersion: 1,
      type: "Verdict",
      id,
      tenantId: "ten_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      matterId: "mat_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      propositionId: "prp_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      verdict: "UNRESOLVED",
      reasonCodes: ["unresolved_insufficient_evidence", "missing_connector_data"],
      method: "deterministic",
      policyVersion: "policy.v1",
      evidenceIds: ["psg_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
      modelVersion: null,
      retrieverVersion: null,
      reviewerState: "pending",
      redaction: "internal",
    });
    expect(record.verdict).toBe("UNRESOLVED");
  });

  it("does not accept invented verdicts", () => {
    const id = stableId("Verdict", {
      researchRunId: "run_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      propositionId: "prp_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      sequence: 1,
    });
    expect(() =>
      validateVerdictRecord({
        schemaVersion: 1,
        id,
        tenantId: "ten_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        matterId: "mat_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        propositionId: "prp_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        verdict: "PROVED_TRUE",
        reasonCodes: ["quotation_exact"],
        method: "deterministic",
        policyVersion: "policy.v1",
        evidenceIds: [],
        modelVersion: null,
        retrieverVersion: null,
        reviewerState: "pending",
      }),
    ).toThrow(/unknown verdict/);
  });

  it("does not treat unresolved or unsupported propositions as memo-admissible", () => {
    expect(propositionAdmissibleInMemo("FULL_SUPPORT", "accepted")).toBe(true);
    expect(propositionAdmissibleInMemo("PARTIAL_SUPPORT", "accepted")).toBe(true);
    expect(propositionAdmissibleInMemo("FULL_SUPPORT", "pending")).toBe(false);
    expect(propositionAdmissibleInMemo("UNRESOLVED", "accepted")).toBe(false);
    expect(propositionAdmissibleInMemo("NO_SUPPORT", "accepted")).toBe(false);
  });
});
