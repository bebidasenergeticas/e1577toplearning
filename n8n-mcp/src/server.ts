import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "./config.js";
import { N8nClient, type Page } from "./n8n-client.js";
import { registerAdminTools } from "./tools/admin.js";
import { registerDataTableTools } from "./tools/data-tables.js";
import { defineTool, type ToolContext } from "./tools/define.js";
import { registerExecutionTools } from "./tools/executions.js";
import { registerWorkflowTools } from "./tools/workflows.js";

export const SERVER_NAME = "n8n-mcp";
export const SERVER_VERSION = "1.0.0";

const INSTRUCTIONS = `Tools to manage an n8n automation instance through its public REST API.
- Start with n8n_list_workflows to find workflow ids; n8n_get_workflow shows the full definition.
- To change a workflow, prefer n8n_edit_workflow (targeted node/connection edits) over resending every node.
- To debug a failure: n8n_list_executions with status=error, then n8n_get_execution in summary mode.
- To run a workflow, call its webhook with n8n_trigger_webhook (the API cannot start other trigger types).
- Destructive tools (delete, update) cannot be undone: confirm with the user before using them.`;

export function createServer(config: Config, client = new N8nClient(config)): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { instructions: config.readOnly ? `${INSTRUCTIONS}\n- This server runs in read-only mode.` : INSTRUCTIONS },
  );
  const ctx: ToolContext = { client, config };

  defineTool(server, ctx, {
    name: "n8n_health_check",
    title: "Check n8n connection",
    description: "Check that the n8n instance is reachable and the API key works. Use it first if other tools fail.",
    inputSchema: {},
    mutates: false,
    handler: async (_args, { client, config }) => {
      await client.get<Page<unknown>>("workflows", { limit: 1 });
      return {
        ok: true,
        apiUrl: config.apiUrl,
        webhookBaseUrl: config.webhookBaseUrl,
        readOnly: config.readOnly,
        server: `${SERVER_NAME} ${SERVER_VERSION}`,
      };
    },
  });

  registerWorkflowTools(server, ctx);
  registerExecutionTools(server, ctx);
  registerDataTableTools(server, ctx);
  registerAdminTools(server, ctx);
  return server;
}
