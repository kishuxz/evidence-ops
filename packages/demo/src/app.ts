import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Workspace } from "@evidenceops/cli";
import { graphToCanonicalJson } from "@evidenceops/graph";
import { redline } from "@evidenceops/monitor";
import { Telemetry } from "@evidenceops/obs";
import { DEMO_ADMIN_TOKEN, DEMO_RESET_CONFIRM, DEMO_REVIEWER_TOKEN, DEMO_SEED } from "./seed.js";

export type DemoRequest = {
  method: string;
  path: string;
  url: string;
  headers: Record<string, string | undefined>;
  body: unknown;
};

export type DemoResponse = {
  status: number;
  body: unknown;
};

const RATE_LIMIT = 60;
const WINDOW_MS = 60_000;
const TIMEOUT_MS = 5_000;

function header(req: DemoRequest, name: string): string {
  return (req.headers[name] ?? req.headers[name.toLowerCase()] ?? "").trim();
}

export class DemoApp {
  readonly telemetry = new Telemetry();
  private readonly limiter = new Map<string, number[]>();
  private readonly idempotency = new Map<string, DemoResponse>();
  readonly workspace: Workspace;

  constructor(private readonly dataDir: string) {
    mkdirSync(dataDir, { recursive: true });
    this.workspace = new Workspace(dataDir);
  }

  handle(req: DemoRequest, started = Date.now()): DemoResponse {
    const correlationId = header(req, "x-correlation-id") || "demo";
    return this.telemetry.withCorrelation(correlationId, () => {
      try {
        if (Date.now() - started > TIMEOUT_MS) {
          return { status: 504, body: { error: "timeout" } };
        }
        const token = header(req, "authorization").replace(/^Bearer\s+/i, "");
        if (!this.rateLimit(token || req.path)) {
          this.telemetry.log("warn", "rate_limited", correlationId, { path: req.path });
          return { status: 429, body: { error: "rate_limited" } };
        }
        const idem = header(req, "idempotency-key");
        if (idem && this.idempotency.has(idem)) {
          return this.idempotency.get(idem) ?? { status: 500, body: { error: "idempotency" } };
        }
        const response = this.route(req, token, correlationId);
        if (idem) {
          this.idempotency.set(idem, response);
        }
        this.telemetry.log("info", "http", correlationId, {
          path: req.path,
          status: response.status,
          public: false,
          liveCourtListener: false,
        });
        return response;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.telemetry.log("error", "handler_failed", correlationId, { message });
        return { status: 400, body: { error: message } };
      }
    });
  }

  private rateLimit(key: string): boolean {
    const now = Date.now();
    const recent = (this.limiter.get(key) ?? []).filter((stamp) => now - stamp < WINDOW_MS);
    if (recent.length >= RATE_LIMIT) {
      return false;
    }
    recent.push(now);
    this.limiter.set(key, recent);
    return true;
  }

  private route(req: DemoRequest, token: string, correlationId: string): DemoResponse {
    if (req.method === "GET" && req.path === "/health") {
      return {
        status: 200,
        body: {
          ok: true,
          bind: "127.0.0.1",
          public: false,
          liveCourtListener: false,
          network: false,
          correlationId,
        },
      };
    }
    if (req.method === "GET" && req.path === "/metrics") {
      return {
        status: 200,
        body: {
          spans: this.telemetry.spans.length,
          logs: this.telemetry.logs.length,
          p50: this.telemetry.percentile(this.telemetry.metrics.workflowLatencyMs, 50),
          slo: null,
        },
      };
    }
    if (req.method === "POST" && req.path === "/v1/reset") {
      return this.reset(req);
    }
    if (req.method === "POST" && req.path === "/v1/bootstrap") {
      return this.bootstrap(token);
    }
    const tenant = header(req, "x-tenant") || DEMO_SEED.tenantId;
    const matter = header(req, "x-matter") || DEMO_SEED.matterId;
    if (req.method === "POST" && req.path === "/v1/ingest") {
      return {
        status: 200,
        body: this.workspace.ingest(tenant, matter, token, DEMO_SEED.snapshotId),
      };
    }
    if (req.method === "POST" && req.path === "/v1/retrieve") {
      return {
        status: 200,
        body: this.workspace.retrieve(tenant, matter, token, {
          text: DEMO_SEED.proposition,
          jurisdiction: "US-FED",
          citedDocumentId: DEMO_SEED.snapshotId,
        }),
      };
    }
    if (req.method === "POST" && req.path === "/v1/verify") {
      return {
        status: 200,
        body: this.workspace.verify(tenant, matter, token, {
          proposition: DEMO_SEED.proposition,
          quotation: DEMO_SEED.quotation,
          pinpoint: DEMO_SEED.pinpoint,
          citation: DEMO_SEED.citation,
          citedDocumentId: DEMO_SEED.snapshotId,
          jurisdiction: "US-FED",
        }),
      };
    }
    if (req.method === "POST" && req.path === "/v1/approve") {
      return { status: 200, body: this.workspace.approve(tenant, matter, token) };
    }
    if (req.method === "POST" && req.path === "/v1/review") {
      const verify = this.workspace.verify(tenant, matter, token, {
        proposition: DEMO_SEED.proposition,
        quotation: DEMO_SEED.quotation,
        pinpoint: DEMO_SEED.pinpoint,
        citation: DEMO_SEED.citation,
        citedDocumentId: DEMO_SEED.snapshotId,
      });
      return {
        status: 200,
        body: this.workspace.review(tenant, matter, token, verify.propositionId, "accept"),
      };
    }
    if (req.method === "POST" && req.path === "/v1/authority/update") {
      const change = redline(DEMO_SEED.previousAuthority, DEMO_SEED.nextAuthority);
      return {
        status: 200,
        body: {
          changeClass: change.changeClass,
          redline: change,
          provenance: {
            previousHash: DEMO_SEED.previousAuthority,
            next: DEMO_SEED.nextAuthority,
            liveCourtListener: false,
          },
        },
      };
    }
    if (req.method === "GET" && req.path === "/v1/trace") {
      return { status: 200, body: this.workspace.trace(tenant, matter, token, DEMO_SEED.propositionId) };
    }
    if (req.method === "GET" && req.path === "/v1/impact") {
      return { status: 200, body: this.workspace.impact(tenant, matter, token, DEMO_SEED.versionId) };
    }
    return { status: 404, body: { error: "not_found" } };
  }

  bootstrap(token: string): DemoResponse {
    const admin = token || DEMO_ADMIN_TOKEN;
    try {
      this.workspace.init({
        tenant: DEMO_SEED.tenantId,
        matter: DEMO_SEED.matterId,
        token: admin,
        user: "demo-admin",
        role: "tenant_admin",
      });
    } catch {
      // idempotent bootstrap
    }
    try {
      this.workspace.init({
        tenant: DEMO_SEED.tenantId,
        matter: DEMO_SEED.matterId,
        token: DEMO_REVIEWER_TOKEN,
        user: "demo-reviewer",
        role: "reviewer",
      });
    } catch {
      // already registered
    }
    const graphPath = join(this.dataDir, "graph.json");
    writeFileSync(graphPath, graphToCanonicalJson(DEMO_SEED.graph));
    this.workspace.ingest(DEMO_SEED.tenantId, DEMO_SEED.matterId, admin, DEMO_SEED.snapshotId);
    this.workspace.graphValidate(DEMO_SEED.tenantId, DEMO_SEED.matterId, admin, graphPath);
    return {
      status: 200,
      body: {
        tenantId: DEMO_SEED.tenantId,
        matterId: DEMO_SEED.matterId,
        public: false,
        liveCourtListener: false,
        privileged: false,
      },
    };
  }

  private reset(req: DemoRequest): DemoResponse {
    const url = new URL(req.url, "http://127.0.0.1");
    if (url.searchParams.get("confirm") !== DEMO_RESET_CONFIRM) {
      return { status: 400, body: { error: "reset requires confirm=demo-data-only" } };
    }
    if (existsSync(this.dataDir)) {
      rmSync(this.dataDir, { recursive: true, force: true });
    }
    mkdirSync(this.dataDir, { recursive: true });
    this.idempotency.clear();
    return { status: 200, body: { reset: "demo-data-only", public: false } };
  }
}
