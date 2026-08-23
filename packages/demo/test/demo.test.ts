import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DemoApp } from "../src/app.js";
import { runFounderDemo, type HttpClient } from "../src/script.js";
import { DEMO_ADMIN_TOKEN, DEMO_RESET_CONFIRM, DEMO_SEED } from "../src/seed.js";

function clientFor(app: DemoApp): HttpClient {
  return async (path, init = {}) => {
    const url = new URL(path, "http://127.0.0.1");
    const headers: Record<string, string | undefined> = { ...init.headers };
    const result = app.handle({
      method: init.method ?? "GET",
      path: url.pathname,
      url: url.toString(),
      headers,
      body: {},
    });
    return { status: result.status, body: result.body };
  };
}

describe("private fixture demo", () => {
  it("runs the ten-step founder workflow on 127.0.0.1 semantics", async () => {
    const app = new DemoApp(mkdtempSync(join(tmpdir(), "demo-app-")));
    const result = await runFounderDemo(clientFor(app));
    expect(result.public).toBe(false);
    expect(result.liveCourtListener).toBe(false);
    const steps = result.steps as Record<string, Record<string, unknown>>;
    expect(steps.health?.public).toBe(false);
    expect(steps.verify?.verdict).toBe("FULL_SUPPORT");
    expect(steps.review?.recorded).toBe(true);
    expect(steps.authorityUpdate?.changeClass).toBe("supersession");
    expect(steps.impact?.affected).toBeDefined();
    expect(steps.trace?.kind).toBe("evidence");
  });

  it("rejects reset without the demo-data-only confirm", () => {
    const app = new DemoApp(mkdtempSync(join(tmpdir(), "demo-reset-")));
    const denied = app.handle({
      method: "POST",
      path: "/v1/reset",
      url: "http://127.0.0.1/v1/reset",
      headers: { authorization: `Bearer ${DEMO_ADMIN_TOKEN}` },
      body: {},
    });
    expect(denied.status).toBe(400);
    const allowed = app.handle({
      method: "POST",
      path: "/v1/reset",
      url: `http://127.0.0.1/v1/reset?confirm=${DEMO_RESET_CONFIRM}`,
      headers: { authorization: `Bearer ${DEMO_ADMIN_TOKEN}` },
      body: {},
    });
    expect(allowed.status).toBe(200);
  });

  it("enforces A1 on retrieve without a token", () => {
    const app = new DemoApp(mkdtempSync(join(tmpdir(), "demo-auth-")));
    app.bootstrap(DEMO_ADMIN_TOKEN);
    const result = app.handle({
      method: "POST",
      path: "/v1/retrieve",
      url: "http://127.0.0.1/v1/retrieve",
      headers: { "x-tenant": DEMO_SEED.tenantId, "x-matter": DEMO_SEED.matterId },
      body: {},
    });
    expect(result.status).toBe(400);
  });

  it("is idempotent for bootstrap", () => {
    const app = new DemoApp(mkdtempSync(join(tmpdir(), "demo-idemp-")));
    const first = app.handle({
      method: "POST",
      path: "/v1/bootstrap",
      url: "http://127.0.0.1/v1/bootstrap",
      headers: { authorization: `Bearer ${DEMO_ADMIN_TOKEN}`, "idempotency-key": "k1" },
      body: {},
    });
    const second = app.handle({
      method: "POST",
      path: "/v1/bootstrap",
      url: "http://127.0.0.1/v1/bootstrap",
      headers: { authorization: `Bearer ${DEMO_ADMIN_TOKEN}`, "idempotency-key": "k1" },
      body: {},
    });
    expect(first.status).toBe(200);
    expect(second.body).toEqual(first.body);
  });
});
