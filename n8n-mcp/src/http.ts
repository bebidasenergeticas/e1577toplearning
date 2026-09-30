import { timingSafeEqual } from "node:crypto";
import { createServer as createHttpServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Config } from "./config.js";
import { createServer } from "./server.js";

export interface HttpOptions {
  port: number;
  host: string;
  /** Clients must send "Authorization: Bearer <token>". Required unless explicitly disabled. */
  authToken?: string;
  path: string;
}

const MAX_BODY_BYTES = 4 * 1024 * 1024;

function sendJson(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}): void {
  res.writeHead(status, { "Content-Type": "application/json", ...headers });
  res.end(JSON.stringify(body));
}

function rpcError(res: ServerResponse, status: number, message: string, headers?: Record<string, string>): void {
  sendJson(res, status, { jsonrpc: "2.0", error: { code: -32000, message }, id: null }, headers);
}

function tokenMatches(header: string | undefined, expected: string): boolean {
  const match = /^Bearer\s+(.+)$/i.exec(header ?? "");
  if (!match) return false;
  const given = Buffer.from(match[1].trim());
  const wanted = Buffer.from(expected);
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new Error("Request body too large");
    chunks.push(chunk as Buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

/**
 * Serves MCP over Streamable HTTP in stateless mode: every request gets its own
 * server instance, so the process can sit behind a load balancer and restart freely.
 */
export function startHttpServer(config: Config, options: HttpOptions): Promise<Server> {
  const httpServer = createHttpServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (url.pathname === "/health") {
      sendJson(res, 200, { status: "ok" });
      return;
    }
    if (url.pathname !== options.path) {
      sendJson(res, 404, { error: "Not found" });
      return;
    }
    if (options.authToken && !tokenMatches(req.headers.authorization, options.authToken)) {
      rpcError(res, 401, "Unauthorized", { "WWW-Authenticate": "Bearer" });
      return;
    }
    if (req.method !== "POST") {
      // Stateless mode has no sessions to stream to or terminate.
      rpcError(res, 405, "Method not allowed", { Allow: "POST" });
      return;
    }

    let body: unknown;
    try {
      body = await readJsonBody(req);
    } catch (error) {
      rpcError(res, 400, `Invalid request body: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }

    const server = createServer(config);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on("close", () => {
      void transport.close();
      void server.close();
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) rpcError(res, 500, "Internal server error");
    }
  });

  return new Promise((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(options.port, options.host, () => resolve(httpServer));
  });
}
