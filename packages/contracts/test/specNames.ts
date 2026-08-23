import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export function contractsRepoRoot(): string {
  let dir = fileURLToPath(new URL(".", import.meta.url));
  for (let i = 0; i < 10; i += 1) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    dir = join(dir, "..");
  }
  throw new Error("repo root not found");
}

export function graphNodeNames(): string[] {
  const markdown = readFileSync(join(contractsRepoRoot(), "docs/LEGAL_EVIDENCE_GRAPH.md"), "utf8");
  const section = markdown.split("## Nodes")[1]?.split("## Relationships")[0] ?? "";
  return [...section.matchAll(/`([A-Z][A-Za-z]+)`/g)].map((match) => match[1] ?? "").filter(Boolean);
}

export function graphEdgeNames(): string[] {
  const markdown = readFileSync(join(contractsRepoRoot(), "docs/LEGAL_EVIDENCE_GRAPH.md"), "utf8");
  const section = markdown.split("## Relationships")[1]?.split("## Invariants")[0] ?? "";
  return [...section.matchAll(/`([A-Z_]+)`/g)].map((match) => match[1] ?? "").filter(Boolean);
}
