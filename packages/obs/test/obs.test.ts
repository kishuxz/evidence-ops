import { describe, expect, it } from "vitest";
import { Telemetry } from "../src/index.js";

describe("telemetry", () => {
  it("records correlation ids, spans, structured logs, and failure alerts", () => {
    let t = 0;
    const telemetry = new Telemetry(
      () => "2026-08-22T00:00:00Z",
      () => {
        t += 10;
        return t;
      },
    );
    telemetry.withCorrelation("corr-1", () => {
      telemetry.span("workflow", "corr-1", () => {
        telemetry.recordWorkflow(12, 0.003);
        telemetry.alertRetry("corr-1", 2);
        telemetry.alertDeadLetter("corr-1", "authority_not_found");
      });
    });
    expect(telemetry.logs.every((line) => line.correlationId === "corr-1")).toBe(true);
    expect(telemetry.spans.some((span) => span.name === "workflow")).toBe(true);
    expect(telemetry.metrics.deadLetters).toBe(1);
    expect(telemetry.metrics.retries).toBe(1);
    expect(telemetry.percentile(telemetry.metrics.workflowLatencyMs, 50)).toBe(12);
    expect(telemetry.percentile([], 95)).toBeNull();
  });
});
