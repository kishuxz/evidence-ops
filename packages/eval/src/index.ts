export {
  CASE_CATEGORIES,
  CATEGORY_VERDICT,
  TARGET_COUNTS,
  countByCategory,
  sha256Text,
  validateEvalCase,
  type CaseCategory,
  type CorpusManifest,
  type EvalCase,
} from "./schema.js";
export { INITIAL_CASES, initialManifest, makeCase } from "./fixtures.js";
export { CORPUS, corpusManifest, expandToTarget } from "./generate.js";
