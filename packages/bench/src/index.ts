import { CORPUS, type EvalCase } from "@evidenceops/eval";
import { OfflineIndex } from "@evidenceops/retrieve";
import { verifyInputFromEvalCase, verifyProposition } from "@evidenceops/verify";

export const BASELINES = ["model_only", "vector_rag", "hybrid_citations", "evidenceops"] as const;
export type Baseline = (typeof BASELINES)[number];

export type Cell = { expected: string; predicted: string };

export type BaselineReport = {
  baseline: Baseline;
  total: number;
  correct: number;
  unresolved: number;
  unresolvedCountedAsCorrect: false;
  confusion: Record<string, Record<string, number>>;
  p50Ms: number;
  p95Ms: number;
  costUsd: number;
  provenanceGuard: "unavailable";
};

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx] ?? 0;
}

function bump(matrix: Record<string, Record<string, number>>, expected: string, predicted: string): void {
  const row = matrix[expected] ?? {};
  row[predicted] = (row[predicted] ?? 0) + 1;
  matrix[expected] = row;
}

function indexCorpus(cases: EvalCase[]): OfflineIndex {
  const index = new OfflineIndex();
  for (const item of cases) {
    index.add({
      id: item.snapshot.id,
      caption: item.citation.raw,
      text: item.snapshot.text,
      jurisdiction: item.jurisdiction,
      date: "2020-01-01",
      versionLocator: "v1",
    });
  }
  return index;
}

function modelOnly(item: EvalCase): string {
  if (item.citation.quotation.trim() === "") {
    return "UNRESOLVED";
  }
  return "FULL_SUPPORT";
}

function vectorRag(item: EvalCase, index: OfflineIndex): string {
  const hit = index.retrieve({ text: item.proposition }, 1).hits[0];
  if (!hit) {
    return "UNRESOLVED";
  }
  return hit.snippet.includes(item.citation.quotation) ? "FULL_SUPPORT" : "NO_SUPPORT";
}

function hybridCitations(item: EvalCase, index: OfflineIndex): string {
  const result = index.retrieve({
    text: `${item.proposition} ${item.citation.raw}`,
    jurisdiction: item.jurisdiction,
    citedDocumentId: item.snapshot.id,
  });
  const hit = result.hits[0];
  if (!hit) {
    return "UNRESOLVED";
  }
  if (hit.wrongDocumentRisk && hit.id !== item.snapshot.id) {
    return "NO_SUPPORT";
  }
  if (!hit.snippet.includes(item.citation.quotation)) {
    return "NO_SUPPORT";
  }
  return item.expectedVerdict === "PARTIAL_SUPPORT" ? "FULL_SUPPORT" : "FULL_SUPPORT";
}

function evidenceops(item: EvalCase): string {
  return verifyProposition(verifyInputFromEvalCase(item)).verdict;
}

function predict(baseline: Baseline, item: EvalCase, index: OfflineIndex): string {
  if (baseline === "model_only") {
    return modelOnly(item);
  }
  if (baseline === "vector_rag") {
    return vectorRag(item, index);
  }
  if (baseline === "hybrid_citations") {
    return hybridCitations(item, index);
  }
  return evidenceops(item);
}

export function runBaseline(baseline: Baseline, cases: EvalCase[] = CORPUS): BaselineReport {
  const index = indexCorpus(cases);
  const confusion: Record<string, Record<string, number>> = {};
  const latencies: number[] = [];
  let correct = 0;
  let unresolved = 0;
  for (const item of cases) {
    const started = process.hrtime.bigint();
    const predicted = predict(baseline, item, index);
    const ended = process.hrtime.bigint();
    latencies.push(Number(ended - started) / 1_000_000);
    bump(confusion, item.expectedVerdict, predicted);
    if (predicted === "UNRESOLVED") {
      unresolved += 1;
    } else if (predicted === item.expectedVerdict) {
      correct += 1;
    }
  }
  return {
    baseline,
    total: cases.length,
    correct,
    unresolved,
    unresolvedCountedAsCorrect: false,
    confusion,
    p50Ms: percentile(latencies, 50),
    p95Ms: percentile(latencies, 95),
    costUsd: Number((cases.length * (baseline === "evidenceops" ? 0.003 : 0.001)).toFixed(4)),
    provenanceGuard: "unavailable",
  };
}

export function runAllBaselines(cases: EvalCase[] = CORPUS): BaselineReport[] {
  return BASELINES.map((baseline) => runBaseline(baseline, cases));
}

export function renderBaselineMarkdown(reports: BaselineReport[]): string {
  const lines = [
    "# Q1 baseline report",
    "",
    "Generated from `@evidenceops/bench` on the 200-case synthetic engineering corpus.",
    "UNRESOLVED is never counted as correct. Provenance Guard (I1) is unavailable.",
    "Latency is a local measurement, not an SLO. Cost is a fixture unit conversion, not a vendor invoice.",
    "",
  ];
  for (const report of reports) {
    lines.push(`## ${report.baseline}`);
    lines.push("");
    lines.push(`- total: ${report.total}`);
    lines.push(`- correct: ${report.correct}`);
    lines.push(`- unresolved: ${report.unresolved}`);
    lines.push(`- unresolvedCountedAsCorrect: ${report.unresolvedCountedAsCorrect}`);
    lines.push(`- p50Ms: ${report.p50Ms.toFixed(3)}`);
    lines.push(`- p95Ms: ${report.p95Ms.toFixed(3)}`);
    lines.push(`- costUsd (fixture units): ${report.costUsd}`);
    lines.push(`- provenanceGuard: ${report.provenanceGuard}`);
    lines.push("");
    lines.push("Confusion (expected → predicted counts):");
    lines.push("");
    lines.push("```json");
    lines.push(JSON.stringify(report.confusion, null, 2));
    lines.push("```");
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}
