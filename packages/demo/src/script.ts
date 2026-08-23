import { DEMO_ADMIN_TOKEN, DEMO_SEED } from "./seed.js";

export type HttpClient = (path: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) => Promise<{ status: number; body: unknown }>;

export async function runFounderDemo(client: HttpClient): Promise<Record<string, unknown>> {
  const auth = {
    authorization: `Bearer ${DEMO_ADMIN_TOKEN}`,
    "x-tenant": DEMO_SEED.tenantId,
    "x-matter": DEMO_SEED.matterId,
    "x-correlation-id": "founder-demo",
  };
  const steps: Record<string, unknown> = {};
  const health = await client("/health");
  steps.health = health.body;
  steps.bootstrap = (await client("/v1/bootstrap", { method: "POST", headers: { ...auth, "idempotency-key": "demo-bootstrap" } })).body;
  steps.ingest = (await client("/v1/ingest", { method: "POST", headers: { ...auth, "idempotency-key": "demo-ingest" } })).body;
  steps.retrieve = (await client("/v1/retrieve", { method: "POST", headers: auth })).body;
  steps.extract = { proposition: DEMO_SEED.proposition, citation: DEMO_SEED.citation };
  steps.verify = (await client("/v1/verify", { method: "POST", headers: auth })).body;
  steps.approve = (await client("/v1/approve", { method: "POST", headers: auth })).body;
  steps.review = (await client("/v1/review", { method: "POST", headers: auth })).body;
  steps.authorityUpdate = (await client("/v1/authority/update", { method: "POST", headers: auth })).body;
  steps.trace = (await client("/v1/trace", { method: "GET", headers: auth })).body;
  steps.impact = (await client("/v1/impact", { method: "GET", headers: auth })).body;
  return {
    public: false,
    liveCourtListener: false,
    privileged: false,
    legalAdvice: false,
    steps,
  };
}

async function retry<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (error) {
      last = error;
    }
  }
  throw last;
}

export async function httpClient(baseUrl: string): Promise<HttpClient> {
  return async (path, init = {}) => {
        const response = await retry(() => {
          const request: RequestInit = {
            method: init.method ?? "GET",
            headers: { "content-type": "application/json", ...init.headers },
          };
          if (init.body !== undefined) {
            request.body = init.body;
          }
          return fetch(`${baseUrl}${path}`, request);
        });
    return { status: response.status, body: await response.json() };
  };
}

const isMain = process.argv[1]?.includes("script");
if (isMain) {
  const base = process.env.EVIDENCEOPS_DEMO_URL ?? "http://127.0.0.1:8787";
  const client = await httpClient(base);
  const result = await runFounderDemo(client);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
