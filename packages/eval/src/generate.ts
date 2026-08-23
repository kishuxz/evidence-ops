import { TARGET_COUNTS, type CaseCategory, type EvalCase, countByCategory, type CorpusManifest } from "./schema.js";
import { INITIAL_CASES, makeCase } from "./fixtures.js";

function pad(n: number): string {
  return String(n).padStart(3, "0");
}

function generateCategory(category: CaseCategory, start: number, count: number): EvalCase[] {
  const cases: EvalCase[] = [];
  for (let i = start; i < start + count; i += 1) {
    const n = pad(i);
    const party = `Fixture Party ${n}`;
    const holding = "The filing deadline is jurisdictional.";
    if (category === "full_support") {
      cases.push(
        makeCase(`eval.full_support.${n}`, "full_support", {
          proposition: holding,
          raw: `${party} v. Respondent, ${i} Fix. ${i} (Fict. Cir. 2021)`,
          pinpoint: `${i} Fix. at ${i}`,
          quotation: holding,
          text: `${party} v. Respondent\n${holding}`,
          rationale: "Synthetic engineering fixture: quotation equals proposition and appears in the snapshot.",
        }),
      );
    } else if (category === "partial_support") {
      cases.push(
        makeCase(`eval.partial_support.${n}`, "partial_support", {
          proposition: `${holding} and may never be excused.`,
          raw: `${party} v. Respondent, ${i} Fix. ${i} (Fict. Cir. 2021)`,
          pinpoint: `${i} Fix. at ${i}`,
          quotation: holding,
          text: `${party} v. Respondent\n${holding}`,
          rationale: "Synthetic engineering fixture: extra clause is not in the passage.",
        }),
      );
    } else if (category === "no_support") {
      cases.push(
        makeCase(`eval.no_support.${n}`, "no_support", {
          proposition: "Oral argument is always required.",
          raw: `${party} v. Respondent, ${i} Fix. ${i} (Fict. Cir. 2021)`,
          pinpoint: `${i} Fix. at ${i}`,
          quotation: holding,
          text: `${party} v. Respondent\n${holding}`,
          rationale: "Synthetic engineering fixture: real snapshot does not support the proposition.",
        }),
      );
    } else if (category === "fabricated_authority") {
      cases.push(
        makeCase(`eval.fabricated_authority.${n}`, "fabricated_authority", {
          proposition: "Silence is consent.",
          raw: `${900 + i} U.S. ${900 + i} (2099)`,
          pinpoint: "at 1",
          quotation: "Silence is consent.",
          text: "This corpus has no such reporter volume.",
          rationale: "Synthetic engineering fixture: fabricated citation.",
        }),
      );
    } else if (category === "wrong_quotation") {
      cases.push(
        makeCase(`eval.wrong_quotation.${n}`, "wrong_quotation", {
          proposition: holding,
          raw: `${party} v. Respondent, ${i} Fix. ${i} (Fict. Cir. 2021)`,
          pinpoint: `${i} Fix. at ${i}`,
          quotation: "Deadlines are merely hortatory.",
          text: `${party} v. Respondent\n${holding}`,
          rationale: "Synthetic engineering fixture: quotation is not in the snapshot.",
        }),
      );
    } else if (category === "wrong_jurisdiction") {
      cases.push(
        makeCase(`eval.wrong_jurisdiction.${n}`, "wrong_jurisdiction", {
          proposition: "The state rule governs this federal matter.",
          raw: `People v. ${party}, ${i} State Fix. ${i} (Fict. 2018)`,
          pinpoint: "at 2",
          quotation: "State filing rules are not jurisdictional in this court.",
          text: `People v. ${party}\nState filing rules are not jurisdictional in this court.`,
          rationale: "Synthetic engineering fixture: wrong jurisdiction.",
          jurisdiction: "US-FED",
        }),
      );
    } else if (category === "stale_authority") {
      cases.push(
        makeCase(`eval.stale_authority.${n}`, "stale_authority", {
          proposition: "Paper filing is required.",
          raw: `Fictitious Agency Guidance ${n} (2010)`,
          pinpoint: "at 2",
          quotation: "Paper filing is required.",
          text: `Guidance ${n} (2010, superseded)\nPaper filing is required.\nSUPERSEDED: electronic filing is now mandatory.`,
          rationale: "Synthetic engineering fixture: superseded snapshot.",
        }),
      );
    } else {
      cases.push(
        makeCase(`eval.wrong_document.${n}`, "wrong_document", {
          proposition: `${party} held that the deadline is jurisdictional.`,
          raw: `${party} v. Respondent, ${i} Fix. ${i} (Fict. Cir. 2021)`,
          pinpoint: "at 3",
          quotation: holding,
          text: `${party} Manufacturing v. Other, ${i} Fix. ${i + 50}\nCosts are awarded to the prevailing party.`,
          rationale: "Synthetic engineering fixture: wrong-document near duplicate.",
        }),
      );
    }
  }
  return cases;
}

export function expandToTarget(seed: EvalCase[] = INITIAL_CASES): EvalCase[] {
  const have = countByCategory(seed);
  const extra: EvalCase[] = [];
  (Object.keys(TARGET_COUNTS) as CaseCategory[]).forEach((category) => {
    const needed = TARGET_COUNTS[category] - (have[category] ?? 0);
    if (needed > 0) {
      extra.push(...generateCategory(category, 2, needed));
    }
  });
  return [...seed, ...extra];
}

export const CORPUS: EvalCase[] = expandToTarget();

export function corpusManifest(): CorpusManifest {
  return {
    schemaVersion: 1,
    corpusId: "evidenceops.eval.v0.1-synthetic-engineering",
    notes:
      "200 synthetic engineering fixtures generated from templates. Not expert-reviewed, not independently reviewed, not CourtListener data, not naturally occurring public-source cases. Awaiting qualified legal review. Constructed single-author engineering fixtures.",
    targetCounts: TARGET_COUNTS,
    actualCounts: countByCategory(CORPUS),
  };
}
