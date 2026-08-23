import { mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
mkdirSync(join(root, "../cli/schemas/v1"), { recursive: true });
copyFileSync(
  join(root, "../contracts/schemas/v1/catalog.json"),
  join(root, "../cli/schemas/v1/catalog.json"),
);

const shared = {
  absWorkingDir: root,
  bundle: true,
  platform: "node",
  format: "esm",
  logLevel: "warning",
  legalComments: "none",
};

await build({ ...shared, entryPoints: ["src/server.ts"], outfile: "dist/server.js" });
await build({ ...shared, entryPoints: ["src/script.ts"], outfile: "dist/script.js" });
