export type Format = "json" | "human";

export type Flags = {
  format: Format;
  debug: boolean;
  dataDir: string;
  tenant?: string;
  matter?: string;
  token?: string;
  ids?: string;
  text?: string;
  jurisdiction?: string;
  asOf?: string;
  versionLocator?: string;
  citedDocumentId?: string;
  proposition?: string;
  quotation?: string;
  pinpoint?: string;
  citation?: string;
  startId?: string;
  versionId?: string;
  propositionId?: string;
  action?: string;
  file?: string;
  role?: string;
  user?: string;
  limit?: string;
};

export type ParsedArgv = {
  command: string;
  subcommand: string | null;
  flags: Flags;
};

const FLAG_ALIASES: Record<string, keyof Flags> = {
  tenant: "tenant",
  matter: "matter",
  token: "token",
  format: "format",
  debug: "debug",
  "data-dir": "dataDir",
  ids: "ids",
  text: "text",
  jurisdiction: "jurisdiction",
  "as-of": "asOf",
  "version-locator": "versionLocator",
  "cited-document-id": "citedDocumentId",
  proposition: "proposition",
  quotation: "quotation",
  pinpoint: "pinpoint",
  citation: "citation",
  "start-id": "startId",
  "version-id": "versionId",
  "proposition-id": "propositionId",
  action: "action",
  file: "file",
  role: "role",
  user: "user",
  limit: "limit",
  json: "format",
};

function asFormat(value: string): Format {
  if (value === "json" || value === "human") {
    return value;
  }
  throw new Error(`unknown format: ${value}`);
}

export function parseArgv(argv: string[]): ParsedArgv {
  const flags: Flags = {
    format: "human",
    debug: false,
    dataDir: ".evidenceops",
  };
  const positionals: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === undefined) {
      break;
    }
    if (arg === "--") {
      positionals.push(...argv.slice(i + 1));
      break;
    }
    if (arg.startsWith("--")) {
      const body = arg.slice(2);
      const eq = body.indexOf("=");
      const rawName = eq >= 0 ? body.slice(0, eq) : body;
      const inline = eq >= 0 ? body.slice(eq + 1) : undefined;
      const name = FLAG_ALIASES[rawName];
      if (!name) {
        throw new Error(`unknown flag --${rawName}`);
      }
      if (name === "debug") {
        flags.debug = true;
        continue;
      }
      if (rawName === "json") {
        flags.format = "json";
        continue;
      }
      const value = inline ?? argv[i + 1];
      if (value === undefined || value.startsWith("--")) {
        throw new Error(`flag --${rawName} requires a value`);
      }
      if (inline === undefined) {
        i += 1;
      }
      if (name === "format") {
        flags.format = asFormat(value);
      } else if (name === "dataDir") {
        flags.dataDir = value;
      } else {
        const key = name as Exclude<keyof Flags, "format" | "debug" | "dataDir">;
        flags[key] = value;
      }
      continue;
    }
    positionals.push(arg);
  }
  const command = positionals[0] ?? "help";
  const subcommand = positionals[1] ?? null;
  return { command, subcommand, flags };
}
