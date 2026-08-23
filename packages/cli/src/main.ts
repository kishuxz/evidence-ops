import { parseArgv } from "./argv.js";
import { CliError, EXIT } from "./errors.js";
import { failure, render, success, type Envelope } from "./format.js";
import { Workspace } from "./workspace.js";

export const CLI_VERSION = "0.1.0-local-unpackaged";

const HELP = `evidenceops — locally packaged CLI (not published to npm)

Usage:
  evidenceops <command> [subcommand] --tenant T --matter M --token TOKEN [flags]

Commands:
  init                 register tenant, matter, and token in --data-dir
  ingest               ingest fixture snapshot ids (fail-closed on partial)
  retrieve             hybrid retrieve in tenant/matter scope
  verify               deterministic proposition verification
  trace                evidence graph trace
  impact               change-impact traversal
  review               renderer HTML; --action accept|reject|request_research
  evaluate             synthetic corpus eval (not expert review)
  graph validate       validate and store a graph JSON file
  approve              record a human publish approval
  help                 this message

Global flags:
  --format json|human  JSON is the automation mode (alias: --json)
  --data-dir PATH      default .evidenceops
  --debug              print stack traces (off by default)

This binary is a packaging artifact. It is not a GitHub Release or registry package.
Fixture snapshots are not CourtListener data. See docs/CLI.md.
`;

export type RunResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export function runCli(argv: string[]): RunResult {
  let command = "help";
  let tenant: string | null = null;
  let matter: string | null = null;
  let format: "json" | "human" = "human";
  let debug = false;
  try {
    const parsed = parseArgv(argv);
    command = parsed.command;
    format = parsed.flags.format;
    debug = parsed.flags.debug;
    tenant = parsed.flags.tenant?.trim() || null;
    matter = parsed.flags.matter?.trim() || null;
    if (command === "help" || command === "--help" || command === "-h") {
      return { exitCode: EXIT.OK, stdout: HELP, stderr: "" };
    }
    if (command === "version" || command === "--version") {
      const envelope = success("version", null, null, {
        version: CLI_VERSION,
        published: false,
        registry: "none",
      });
      return { exitCode: EXIT.OK, stdout: render(envelope, format), stderr: "" };
    }
    const workspace = new Workspace(parsed.flags.dataDir);
    const envelope = dispatch(workspace, parsed);
    return { exitCode: EXIT.OK, stdout: render(envelope, format), stderr: "" };
  } catch (error) {
    if (error instanceof CliError) {
      const envelope = failure(command, tenant, matter, error);
      return { exitCode: error.exitCode, stdout: render(envelope, format), stderr: "" };
    }
    const message = error instanceof Error ? error.message : String(error);
    const stderr = debug && error instanceof Error && error.stack ? `${error.stack}\n` : "";
    const wrapped = new CliError("USAGE", message, EXIT.USAGE);
    return {
      exitCode: EXIT.USAGE,
      stdout: render(failure(command, tenant, matter, wrapped), format),
      stderr,
    };
  }
}

function dispatch(workspace: Workspace, parsed: ReturnType<typeof parseArgv>): Envelope {
  const { command, subcommand, flags } = parsed;
  const tenant = flags.tenant ?? "";
  const matter = flags.matter ?? "";
  if (command === "init") {
    return success("init", tenant, matter, workspace.init({
      tenant,
      matter,
      token: flags.token ?? "",
      user: flags.user ?? "",
      role: flags.role ?? "tenant_admin",
    }));
  }
  if (command === "ingest") {
    return success("ingest", tenant, matter, workspace.ingest(tenant, matter, flags.token, flags.ids));
  }
  if (command === "retrieve") {
    return success(
      "retrieve",
      tenant,
      matter,
      workspace.retrieve(tenant, matter, flags.token, {
        ...(flags.text ? { text: flags.text } : {}),
        ...(flags.jurisdiction ? { jurisdiction: flags.jurisdiction } : {}),
        ...(flags.asOf ? { asOf: flags.asOf } : {}),
        ...(flags.versionLocator ? { versionLocator: flags.versionLocator } : {}),
        ...(flags.citedDocumentId ? { citedDocumentId: flags.citedDocumentId } : {}),
      }),
    );
  }
  if (command === "verify") {
    return success(
      "verify",
      tenant,
      matter,
      workspace.verify(tenant, matter, flags.token, {
        ...(flags.proposition ? { proposition: flags.proposition } : {}),
        ...(flags.quotation ? { quotation: flags.quotation } : {}),
        ...(flags.pinpoint ? { pinpoint: flags.pinpoint } : {}),
        ...(flags.citation ? { citation: flags.citation } : {}),
        ...(flags.citedDocumentId ? { citedDocumentId: flags.citedDocumentId } : {}),
        ...(flags.jurisdiction ? { jurisdiction: flags.jurisdiction } : {}),
      }),
    );
  }
  if (command === "trace") {
    return success("trace", tenant, matter, workspace.trace(tenant, matter, flags.token, flags.startId));
  }
  if (command === "impact") {
    return success("impact", tenant, matter, workspace.impact(tenant, matter, flags.token, flags.versionId));
  }
  if (command === "review") {
    return success(
      "review",
      tenant,
      matter,
      workspace.review(tenant, matter, flags.token, flags.propositionId, flags.action),
    );
  }
  if (command === "evaluate") {
    return success("evaluate", tenant, matter, workspace.evaluate(tenant, matter, flags.token));
  }
  if (command === "graph") {
    if (subcommand !== "validate") {
      throw new CliError("USAGE", "usage: evidenceops graph validate --file FILE", EXIT.USAGE);
    }
    return success(
      "graph.validate",
      tenant,
      matter,
      workspace.graphValidate(tenant, matter, flags.token, flags.file),
    );
  }
  if (command === "approve") {
    return success("approve", tenant, matter, workspace.approve(tenant, matter, flags.token));
  }
  throw new CliError("USAGE", `unknown command ${command}`, EXIT.USAGE);
}
