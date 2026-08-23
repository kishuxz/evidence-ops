import { mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const catalogSrc = join(root, "../contracts/schemas/v1/catalog.json");
const catalogDestDir = join(root, "schemas/v1");

mkdirSync(catalogDestDir, { recursive: true });
copyFileSync(catalogSrc, join(catalogDestDir, "catalog.json"));

await build({
  absWorkingDir: root,
  entryPoints: ["src/bin.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "dist/evidenceops.js",
  banner: { js: "#!/usr/bin/env node" },
  logLevel: "warning",
  legalComments: "none",
});
