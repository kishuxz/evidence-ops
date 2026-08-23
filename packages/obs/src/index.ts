export type LogLevel = "info" | "warn" | "error";

export type StructuredLog = {
  level: LogLevel;
  message: string;
  correlationId: string;
  at: string;
  fields: Record<string, string | number | boolean | null>;
};

export type Span = {
  name: string;
  correlationId: string;
  durationMs: number;
};

export type Metrics = {
  workflowLatencyMs: number[];
  workflowCostUsd: number[];
  connectorFailures: number;
  retrievalFailures: number;
  deadLetters: number;
  retries: number;
};

export class Telemetry {
  readonly logs: StructuredLog[] = [];
  readonly spans: Span[] = [];
  readonly metrics: Metrics = {
    workflowLatencyMs: [],
    workflowCostUsd: [],
    connectorFailures: 0,
    retrievalFailures: 0,
    deadLetters: 0,
    retries: 0,
  };

  constructor(
    private readonly now: () => string = () => "2026-08-22T00:00:00Z",
    private readonly clock: () => number = () => 0,
  ) {}

  withCorrelation<T>(correlationId: string, fn: () => T): T {
    const started = this.clock();
    try {
      return fn();
    } finally {
      this.spans.push({
        name: "correlation",
        correlationId,
        durationMs: Math.max(0, this.clock() - started),
      });
    }
  }

  span<T>(name: string, correlationId: string, fn: () => T): T {
    const started = this.clock();
    try {
      return fn();
    } finally {
      this.spans.push({ name, correlationId, durationMs: Math.max(0, this.clock() - started) });
    }
  }

  log(level: LogLevel, message: string, correlationId: string, fields: StructuredLog["fields"] = {}): void {
    this.logs.push({ level, message, correlationId, at: this.now(), fields });
  }

  recordWorkflow(latencyMs: number, costUsd: number): void {
    this.metrics.workflowLatencyMs.push(latencyMs);
    this.metrics.workflowCostUsd.push(costUsd);
  }

  alertDeadLetter(correlationId: string, reason: string): void {
    this.metrics.deadLetters += 1;
    this.log("error", "dead_letter", correlationId, { reason });
  }

  alertRetry(correlationId: string, attempt: number): void {
    this.metrics.retries += 1;
    this.log("warn", "retry", correlationId, { attempt });
  }

  percentile(values: number[], p: number): number | null {
    if (values.length === 0) {
      return null;
    }
    const sorted = [...values].sort((left, right) => left - right);
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
    return sorted[idx] ?? null;
  }
}
