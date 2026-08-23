import {
  CATEGORY_VERDICT,
  type CaseCategory,
  type EvalCase,
  sha256Text,
  TARGET_COUNTS,
  type CorpusManifest,
  countByCategory,
} from "./schema.js";

const REVIEWER = {
  reviewerId: "eval.reviewer.fixture",
  reviewerVersion: "e1.0",
  annotatedAt: "2026-08-22T00:00:00Z",
};

const REDISTRIBUTION = "original-synthetic-text-authored-for-evidenceops-fixtures";

function snap(id: string, text: string) {
  return {
    id,
    locator: `fixture://synthetic/${id}`,
    contentHash: sha256Text(text),
    text,
    redistribution: REDISTRIBUTION,
    notLiveCourtListener: true as const,
  };
}

function makeCase(
  id: string,
  category: CaseCategory,
  fields: {
    proposition: string;
    raw: string;
    pinpoint: string;
    quotation: string;
    text: string;
    rationale: string;
    jurisdiction?: string;
  },
): EvalCase {
  return {
    schemaVersion: 1,
    id,
    category,
    expectedVerdict: CATEGORY_VERDICT[category],
    jurisdiction: fields.jurisdiction ?? "US-FED",
    proposition: fields.proposition,
    citation: { raw: fields.raw, pinpoint: fields.pinpoint, quotation: fields.quotation },
    snapshot: snap(id, fields.text),
    annotation: { ...REVIEWER, rationale: fields.rationale },
    privileged: false,
  };
}

export const INITIAL_CASES: EvalCase[] = [
  makeCase("eval.full_support.001", "full_support", {
    proposition: "The filing deadline is jurisdictional.",
    raw: "Widget Co. v. Sprocket Ltd., 1 Fix. 1 (Fict. Cir. 2020)",
    pinpoint: "1 Fix. at 3",
    quotation: "The filing deadline is jurisdictional.",
    text: "Widget Co. v. Sprocket Ltd., 1 Fix. 1 (Fict. Cir. 2020)\nThe filing deadline is jurisdictional.",
    rationale: "Quoted sentence appears verbatim and supports the whole proposition.",
  }),
  makeCase("eval.partial_support.001", "partial_support", {
    proposition: "The filing deadline is jurisdictional and may never be excused.",
    raw: "Widget Co. v. Sprocket Ltd., 1 Fix. 1 (Fict. Cir. 2020)",
    pinpoint: "1 Fix. at 3",
    quotation: "The filing deadline is jurisdictional.",
    text: "Widget Co. v. Sprocket Ltd., 1 Fix. 1 (Fict. Cir. 2020)\nThe filing deadline is jurisdictional.",
    rationale: "Authority supports the first clause only; 'never excused' is not in the passage.",
  }),
  makeCase("eval.no_support.001", "no_support", {
    proposition: "Oral argument is always required in the fictitious circuit.",
    raw: "Widget Co. v. Sprocket Ltd., 1 Fix. 1 (Fict. Cir. 2020)",
    pinpoint: "1 Fix. at 3",
    quotation: "The filing deadline is jurisdictional.",
    text: "Widget Co. v. Sprocket Ltd., 1 Fix. 1 (Fict. Cir. 2020)\nThe filing deadline is jurisdictional.",
    rationale: "Real fixture authority exists but does not address oral argument.",
  }),
  makeCase("eval.fabricated_authority.001", "fabricated_authority", {
    proposition: "A made-up reporter holds that silence is consent.",
    raw: "999 U.S. 999 (2099)",
    pinpoint: "999 U.S. at 1001",
    quotation: "Silence is consent.",
    text: "This fixture corpus contains no opinion at 999 U.S. 999.",
    rationale: "Citation does not identify any snapshot in the corpus.",
  }),
  makeCase("eval.wrong_quotation.001", "wrong_quotation", {
    proposition: "The filing deadline is jurisdictional.",
    raw: "Widget Co. v. Sprocket Ltd., 1 Fix. 1 (Fict. Cir. 2020)",
    pinpoint: "1 Fix. at 3",
    quotation: "Deadlines are merely hortatory.",
    text: "Widget Co. v. Sprocket Ltd., 1 Fix. 1 (Fict. Cir. 2020)\nThe filing deadline is jurisdictional.",
    rationale: "Quoted text does not appear at the cited pinpoint.",
  }),
  makeCase("eval.wrong_jurisdiction.001", "wrong_jurisdiction", {
    proposition: "The fictitious state rule governs this federal matter.",
    raw: "People v. Example, 2 State Fix. 10 (Fict. 2018)",
    pinpoint: "2 State Fix. at 12",
    quotation: "State filing rules are not jurisdictional in this court.",
    text: "People v. Example, 2 State Fix. 10 (Fict. 2018)\nState filing rules are not jurisdictional in this court.",
    rationale: "State-court fixture is the wrong jurisdiction for a federal research matter.",
    jurisdiction: "US-FED",
  }),
  makeCase("eval.stale_authority.001", "stale_authority", {
    proposition: "The 2010 guidance still states that paper filing is required.",
    raw: "Fictitious Agency Guidance (2010)",
    pinpoint: "Guidance at 2",
    quotation: "Paper filing is required.",
    text: "Fictitious Agency Guidance (2010, superseded 2019)\nPaper filing is required.\nSUPERSEDED: electronic filing is now mandatory.",
    rationale: "Snapshot records a later supersession of the relied-on sentence.",
  }),
  makeCase("eval.wrong_document.001", "wrong_document", {
    proposition: "Widget Co. held that the deadline is jurisdictional.",
    raw: "Widget Co. v. Sprocket Ltd., 1 Fix. 1 (Fict. Cir. 2020)",
    pinpoint: "1 Fix. at 3",
    quotation: "The filing deadline is jurisdictional.",
    text: "Widget Manufacturing v. Sprocket Parts, 1 Fix. 88 (Fict. Cir. 2020)\nCosts are awarded to the prevailing party.",
    rationale: "Near-duplicate caption retrieved the wrong document; the proposition is not in this snapshot.",
  }),
];

export function initialManifest(): CorpusManifest {
  return {
    schemaVersion: 1,
    corpusId: "evidenceops.eval.v0.1-initial",
    notes:
      "E1 initial synthetic slice. Target counts are the v0.1 plan, not a claim that this corpus is complete or CourtListener-backed.",
    targetCounts: TARGET_COUNTS,
    actualCounts: countByCategory(INITIAL_CASES),
  };
}
