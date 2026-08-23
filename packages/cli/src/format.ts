import type { Format } from "./argv.js";
import type { CliError } from "./errors.js";

export type Envelope = {
  ok: boolean;
  command: string;
  tenantId: string | null;
  matterId: string | null;
  data?: unknown;
  error?: { code: string; message: string; details?: Record<string, unknown> };
};

export function success(
  command: string,
  tenantId: string | null,
  matterId: string | null,
  data: unknown,
): Envelope {
  return { ok: true, command, tenantId, matterId, data };
}

export function failure(
  command: string,
  tenantId: string | null,
  matterId: string | null,
  error: CliError,
): Envelope {
  return {
    ok: false,
    command,
    tenantId,
    matterId,
    error: { code: error.code, message: error.message, details: error.details },
  };
}

function humanLines(value: unknown, prefix = ""): string[] {
  if (value === null || value === undefined) {
    return [`${prefix}(none)`];
  }
  if (typeof value !== "object") {
    return [`${prefix}${String(value)}`];
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [`${prefix}(empty)`];
    }
    return value.flatMap((item, index) => humanLines(item, `${prefix}${index}. `));
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) {
    return [`${prefix}(empty)`];
  }
  return entries.flatMap(([key, item]) => {
    if (item !== null && typeof item === "object") {
      return [`${prefix}${key}:`, ...humanLines(item, `${prefix}  `)];
    }
    return [`${prefix}${key}: ${String(item)}`];
  });
}

export function render(envelope: Envelope, format: Format): string {
  if (format === "json") {
    return `${JSON.stringify(envelope)}\n`;
  }
  if (!envelope.ok && envelope.error) {
    const details = envelope.error.details ? humanLines(envelope.error.details, "  ") : [];
    return [`error: ${envelope.error.code}`, envelope.error.message, ...details].join("\n") + "\n";
  }
  const body = envelope.data === undefined ? [] : humanLines(envelope.data);
  const header = [`command: ${envelope.command}`];
  if (envelope.tenantId) {
    header.push(`tenant: ${envelope.tenantId}`);
  }
  if (envelope.matterId) {
    header.push(`matter: ${envelope.matterId}`);
  }
  return [...header, ...body].join("\n") + "\n";
}
