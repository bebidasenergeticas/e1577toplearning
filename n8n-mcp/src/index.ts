#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { startHttpServer } from "./http.js";
import { createServer, SERVER_NAME, SERVER_VERSION } from "./server.js";

// stdout carries the MCP protocol in stdio mode, so all logging goes to stderr.
const log = (message: string) => console.error(`[${SERVER_NAME}] ${message}`);

async function main(): Promise<void> {
  const config = loadConfig();
  const transport = (process.env.MCP_TRANSPORT ?? "stdio").toLowerCase();
  const mode = config.readOnly ? "read-only" : "read-write";

  if (transport === "stdio") {
    await createServer(config).connect(new StdioServerTransport());
    log(`${SERVER_VERSION} connected over stdio to ${config.apiUrl} (${mode})`);
    return;
  }

  if (transport === "http") {
    const authToken = process.env.MCP_AUTH_TOKEN;
    if (!authToken && process.env.MCP_ALLOW_NO_AUTH !== "true") {
      throw new Error(
        "MCP_AUTH_TOKEN is required in http mode: anyone who can reach the server could otherwise control n8n. " +
          "Set MCP_ALLOW_NO_AUTH=true only if the server is protected some other way.",
      );
    }
    const port = Number(process.env.PORT ?? 3000);
    const host = process.env.HOST ?? "127.0.0.1";
    const path = process.env.MCP_HTTP_PATH ?? "/mcp";
    await startHttpServer(config, { port, host, path, authToken });
    log(`${SERVER_VERSION} listening on http://${host}:${port}${path} for ${config.apiUrl} (${mode})`);
    return;
  }

  throw new Error(`Unknown MCP_TRANSPORT "${transport}" (use "stdio" or "http")`);
}

main().catch((error: unknown) => {
  log(`Fatal: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
