export const EXIT = {
  OK: 0,
  USAGE: 1,
  UNAUTHENTICATED: 2,
  FORBIDDEN: 3,
  NOT_FOUND: 4,
  PARTIAL: 5,
  VALIDATION: 6,
  APPROVAL: 7,
  UNRESOLVED: 8,
} as const;

export type ExitCode = (typeof EXIT)[keyof typeof EXIT];

export class CliError extends Error {
  readonly code: string;
  readonly exitCode: ExitCode;
  readonly details: Record<string, unknown>;

  constructor(code: string, message: string, exitCode: ExitCode, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "CliError";
    this.code = code;
    this.exitCode = exitCode;
    this.details = details;
  }
}
