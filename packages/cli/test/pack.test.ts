import { execFileSync, execSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("pack-install-run from an empty consumer", () => {
  it("installs the local tarball and executes ingest/retrieve/verify", () => {
    execSync("node scripts/build.mjs", { cwd: pkgRoot, stdio: "pipe" });
    const packed = execSync("pnpm pack --pack-destination .", { cwd: pkgRoot, encoding: "utf8" }).trim();
    const tarballName = packed.split("\n").filter(Boolean).at(-1) ?? "";
    const tarball = tarballName.endsWith(".tgz") ? join(pkgRoot, tarballName.replace(/^\.\//, "")) : join(pkgRoot, "evidenceops-cli-0.1.0.tgz");
    const fallback = join(pkgRoot, "evidenceops-cli-0.1.0.tgz");
    const archive = existsSync(tarball) ? tarball : fallback;
    expect(existsSync(archive), archive).toBe(true);

    const consumer = mkdtempSync(join(tmpdir(), "evidenceops-empty-"));
    writeFileSync(join(consumer, "package.json"), '{"name":"empty-consumer","private":true}\n');
    execSync(`npm install --ignore-scripts ${JSON.stringify(archive)}`, {
      cwd: consumer,
      stdio: "pipe",
      env: { ...process.env, npm_config_audit: "false", npm_config_fund: "false" },
    });

    const bin = join(consumer, "node_modules", ".bin", "evidenceops");
    expect(existsSync(bin)).toBe(true);
    const dataDir = join(consumer, "data");
    mkdirSync(dataDir);
    const run = (args: string[]) =>
      execFileSync(bin, ["--data-dir", dataDir, "--format", "json", ...args], { encoding: "utf8" });

    run(["init", "--tenant", "t1", "--matter", "m1", "--token", "tok", "--user", "u1", "--role", "tenant_admin"]);
    const ingest = JSON.parse(run(["ingest", "--tenant", "t1", "--matter", "m1", "--token", "tok", "--ids", "fixture.widget.v1"]));
    expect(ingest.ok).toBe(true);
    expect(ingest.data.network).toBe(false);
    const retrieve = JSON.parse(
      run([
        "retrieve",
        "--tenant",
        "t1",
        "--matter",
        "m1",
        "--token",
        "tok",
        "--text",
        "jurisdictional deadline",
      ]),
    );
    expect(retrieve.data.hits.length).toBeGreaterThan(0);
    const verify = JSON.parse(
      run([
        "verify",
        "--tenant",
        "t1",
        "--matter",
        "m1",
        "--token",
        "tok",
        "--proposition",
        "The filing deadline is jurisdictional.",
        "--quotation",
        "The filing deadline is jurisdictional.",
        "--pinpoint",
        "1 Fix. at 3",
        "--citation",
        "Widget Co. v. Sprocket Ltd., 1 Fix. 1 (Fict. Cir. 2020)",
        "--cited-document-id",
        "fixture.widget.v1",
      ]),
    );
    expect(verify.data.verdict).toBe("FULL_SUPPORT");
  });
});
