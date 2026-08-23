import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { sampleSupportingGraph, graphToCanonicalJson } from "@evidenceops/graph";
import { describe, expect, it } from "vitest";
import { EXIT, runCli } from "../src/index.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "evidenceops-cli-"));
}

function cli(dataDir: string, args: string[]) {
  return runCli(["--data-dir", dataDir, ...args]);
}

describe("evidenceops CLI", () => {
  it("prints help without a stack trace", () => {
    const result = runCli(["help"]);
    expect(result.exitCode).toBe(EXIT.OK);
    expect(result.stdout).toContain("locally packaged");
    expect(result.stdout).toContain("not published");
    expect(result.stderr).toBe("");
  });

  it("requires tenant, matter, and token", () => {
    const dir = tempDir();
    const result = cli(dir, ["ingest", "--ids", "fixture.widget.v1", "--format", "json"]);
    expect(result.exitCode).toBe(EXIT.USAGE);
    expect(result.stdout).toContain("tenant is required");
    expect(result.stderr).toBe("");
  });

  it("runs ingest, retrieve, and verify in one scoped workspace", () => {
    const dir = tempDir();
    const base = ["--tenant", "t1", "--matter", "m1", "--token", "tok", "--format", "json"];
    expect(cli(dir, ["init", ...base, "--user", "u1", "--role", "tenant_admin"]).exitCode).toBe(0);
    const ingest = cli(dir, ["ingest", ...base, "--ids", "fixture.widget.v1"]);
    expect(ingest.exitCode).toBe(0);
    expect(JSON.parse(ingest.stdout).data.liveCourtListener).toBe(false);
    const retrieve = cli(dir, [
      "retrieve",
      ...base,
      "--text",
      "filing deadline is jurisdictional",
      "--jurisdiction",
      "US-FED",
    ]);
    expect(retrieve.exitCode).toBe(0);
    expect(JSON.parse(retrieve.stdout).data.hits.length).toBeGreaterThan(0);
    const verify = cli(dir, [
      "verify",
      ...base,
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
    ]);
    expect(verify.exitCode).toBe(0);
    expect(JSON.parse(verify.stdout).data.verdict).toBe("FULL_SUPPORT");
  });

  it("fails closed on partial ingestion and never reports success", () => {
    const dir = tempDir();
    const base = ["--tenant", "t1", "--matter", "m1", "--token", "tok", "--format", "json"];
    cli(dir, ["init", ...base, "--user", "u1", "--role", "tenant_admin"]);
    const result = cli(dir, ["ingest", ...base, "--ids", "fixture.widget.v1,does-not-exist"]);
    expect(result.exitCode).toBe(EXIT.PARTIAL);
    expect(JSON.parse(result.stdout).ok).toBe(false);
    expect(JSON.parse(result.stdout).error.code).toBe("PARTIAL");
  });

  it("rejects cross-tenant tokens", () => {
    const dir = tempDir();
    cli(dir, [
      "init",
      "--tenant",
      "t1",
      "--matter",
      "m1",
      "--token",
      "alpha",
      "--user",
      "a",
      "--role",
      "tenant_admin",
    ]);
    cli(dir, [
      "init",
      "--tenant",
      "t2",
      "--matter",
      "m2",
      "--token",
      "beta",
      "--user",
      "b",
      "--role",
      "tenant_admin",
    ]);
    const result = cli(dir, [
      "ingest",
      "--tenant",
      "t1",
      "--matter",
      "m1",
      "--token",
      "beta",
      "--ids",
      "fixture.widget.v1",
      "--format",
      "json",
    ]);
    expect(result.exitCode).toBe(EXIT.FORBIDDEN);
  });

  it("does not leak snapshots across tenant/matter scopes", () => {
    const dir = tempDir();
    cli(dir, [
      "init",
      "--tenant",
      "t1",
      "--matter",
      "m1",
      "--token",
      "alpha",
      "--user",
      "a",
      "--role",
      "tenant_admin",
    ]);
    cli(dir, [
      "init",
      "--tenant",
      "t2",
      "--matter",
      "m2",
      "--token",
      "beta",
      "--user",
      "b",
      "--role",
      "tenant_admin",
    ]);
    cli(dir, ["ingest", "--tenant", "t1", "--matter", "m1", "--token", "alpha", "--ids", "fixture.widget.v1"]);
    const result = cli(dir, [
      "retrieve",
      "--tenant",
      "t2",
      "--matter",
      "m2",
      "--token",
      "beta",
      "--text",
      "filing deadline",
      "--format",
      "json",
    ]);
    expect(result.exitCode).toBe(EXIT.NOT_FOUND);
  });

  it("validates a graph file, traces, and reports impact", () => {
    const dir = tempDir();
    const sample = sampleSupportingGraph("cli");
    const graphPath = join(dir, "graph.json");
    writeFileSync(graphPath, graphToCanonicalJson(sample.graph));
    const base = [
      "--tenant",
      sample.tenant,
      "--matter",
      sample.matter,
      "--token",
      "tok",
      "--format",
      "json",
    ];
    cli(dir, ["init", ...base, "--user", "u1", "--role", "tenant_admin"]);
    const validated = cli(dir, ["graph", "validate", ...base, "--file", graphPath]);
    expect(validated.exitCode, validated.stdout).toBe(0);
    const trace = cli(dir, ["trace", ...base, "--start-id", sample.proposition]);
    expect(trace.exitCode).toBe(0);
    expect(JSON.parse(trace.stdout).data.kind).toBe("evidence");
    const impact = cli(dir, ["impact", ...base, "--version-id", sample.version]);
    expect(impact.exitCode).toBe(0);
    expect(JSON.parse(impact.stdout).data.affected).toBeDefined();
  });

  it("requires approval before recording accept", () => {
    const dir = tempDir();
    const base = ["--tenant", "t1", "--matter", "m1", "--token", "tok", "--format", "json"];
    cli(dir, ["init", ...base, "--user", "u1", "--role", "tenant_admin"]);
    cli(dir, ["ingest", ...base, "--ids", "fixture.widget.v1"]);
    const verify = cli(dir, [
      "verify",
      ...base,
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
    ]);
    expect(verify.exitCode).toBe(0);
    const propositionId = JSON.parse(verify.stdout).data.propositionId as string;
    const blocked = cli(dir, ["review", ...base, "--proposition-id", propositionId, "--action", "accept"]);
    expect(blocked.exitCode).toBe(EXIT.APPROVAL);
    expect(cli(dir, ["approve", ...base]).exitCode).toBe(0);
    const accepted = cli(dir, ["review", ...base, "--proposition-id", propositionId, "--action", "accept"]);
    expect(accepted.exitCode).toBe(0);
    expect(JSON.parse(accepted.stdout).data.recorded).toBe(true);
  });

  it("evaluate reports synthetic corpus limits and does not count UNRESOLVED as correct", () => {
    const dir = tempDir();
    const base = ["--tenant", "t1", "--matter", "m1", "--token", "tok", "--format", "json"];
    cli(dir, ["init", ...base, "--user", "u1", "--role", "tenant_admin"]);
    const result = cli(dir, ["evaluate", ...base]);
    expect(result.exitCode).toBe(0);
    const data = JSON.parse(result.stdout).data;
    expect(data.unresolvedCountedAsCorrect).toBe(false);
    expect(data.provenanceGuard).toBe("unavailable");
    expect(data.notes.toLowerCase()).toContain("not expert-reviewed");
    expect(data.total).toBe(200);
  });

  it("omits stack traces by default for unknown flags", () => {
    const result = runCli(["ingest", "--not-a-flag"]);
    expect(result.exitCode).toBe(EXIT.USAGE);
    expect(result.stderr).toBe("");
    expect(result.stdout.toLowerCase()).not.toContain("at ");
  });

  it("rejects invalid graph json", () => {
    const dir = tempDir();
    mkdirSync(dir, { recursive: true });
    const graphPath = join(dir, "bad.json");
    writeFileSync(graphPath, "{\"nope\": true}");
    const base = ["--tenant", "t1", "--matter", "m1", "--token", "tok", "--format", "json"];
    cli(dir, ["init", ...base, "--user", "u1", "--role", "tenant_admin"]);
    const result = cli(dir, ["graph", "validate", ...base, "--file", graphPath]);
    expect(result.exitCode).toBe(EXIT.USAGE);
  });
});
