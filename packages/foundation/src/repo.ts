import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function repoRoot(from: string = fileURLToPath(new URL(".", import.meta.url))): string {
  let dir = from;
  for (let i = 0; i < 10; i += 1) {
    if (existsSync(join(dir, "pnpm-workspace.yaml")) && existsSync(join(dir, "package.json"))) {
      return dir;
    }
    dir = resolve(dir, "..");
  }
  throw new Error("Could not locate repository root from " + from);
}

export function repoPath(...parts: string[]): string {
  return join(repoRoot(), ...parts);
}
