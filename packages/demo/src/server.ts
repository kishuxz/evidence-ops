import { createServer, type IncomingMessage, type Server } from "node:http";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DemoApp, type DemoRequest } from "./app.js";
import { DEMO_BIND, DEMO_PORT } from "./seed.js";

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk as Buffer));
    req.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

export function startDemoServer(
  port = DEMO_PORT,
  host = DEMO_BIND,
  dataDir = process.env.EVIDENCEOPS_DEMO_DATA ?? join(tmpdir(), "evidenceops-demo"),
): Promise<{ server: Server; app: DemoApp; url: string }> {
  const app = new DemoApp(dataDir);
  const server = createServer(async (req, res) => {
    const url = req.url ?? "/";
    const path = url.split("?")[0] ?? "/";
    const headers: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      headers[key] = Array.isArray(value) ? value[0] : value;
    }
    let body: unknown = {};
    try {
      body = await readBody(req);
    } catch {
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "invalid json" }));
      return;
    }
    const request: DemoRequest = {
      method: req.method ?? "GET",
      path,
      url: `http://${host}${url}`,
      headers,
      body,
    };
    const result = app.handle(request);
    res.writeHead(result.status, { "content-type": "application/json" });
    res.end(JSON.stringify(result.body));
  });
  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(port, host, () => {
      resolve({ server, app, url: `http://${host}:${port}` });
    });
  });
}

const isMain = process.argv[1]?.includes("server");
if (isMain) {
  const dataDir = process.env.EVIDENCEOPS_DEMO_DATA ?? mkdtempSync(join(tmpdir(), "evidenceops-demo-"));
  const started = await startDemoServer(Number(process.env.EVIDENCEOPS_DEMO_PORT ?? DEMO_PORT), DEMO_BIND, dataDir);
  process.stdout.write(`evidenceops demo listening on ${started.url} (private bind, not public)\n`);
}
