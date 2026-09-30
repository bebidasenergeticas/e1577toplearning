import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { HttpMethod, Page } from "../n8n-client.js";
import { summarizeExecution } from "../summaries.js";
import type { Json } from "../workflow-edits.js";
import { defineTool, type ToolContext } from "./define.js";
import { cursorParam, idParam, limitParam } from "./params.js";

export function registerExecutionTools(server: McpServer, ctx: ToolContext): void {
  defineTool(server, ctx, {
    name: "n8n_list_executions",
    title: "List executions",
    description:
      "List workflow executions, most recent first, with status, mode and duration. " +
      "Filter by workflow or status (e.g. status=error to find failures).",
    inputSchema: {
      workflowId: z.string().optional().describe("Only executions of this workflow"),
      status: z
        .enum(["success", "error", "running", "waiting", "canceled", "crashed", "new", "unknown"])
        .optional()
        .describe("Only executions with this status"),
      projectId: z.string().optional().describe("Only executions of workflows in this project"),
      limit: limitParam,
      cursor: cursorParam,
    },
    mutates: false,
    handler: async ({ workflowId, status, projectId, limit, cursor }, { client }) => {
      const page = await client.get<Page<Json>>("executions", {
        workflowId,
        status,
        projectId,
        limit,
        cursor,
        includeData: false,
      });
      return { executions: page.data.map((execution) => summarizeExecution(execution)), nextCursor: page.nextCursor ?? null };
    },
  });

  defineTool(server, ctx, {
    name: "n8n_get_execution",
    title: "Get execution",
    description:
      "Get one execution. mode 'summary' (default) shows the error, and per node the status, item count and first " +
      "output item, which is usually enough to debug a failure. mode 'full' returns the raw execution data.",
    inputSchema: {
      id: idParam("Execution id"),
      mode: z.enum(["summary", "full"]).default("summary").describe("Level of detail"),
    },
    mutates: false,
    handler: async ({ id, mode }, { client }) => {
      const execution = await client.get<Json>(`executions/${encodeURIComponent(id)}`, { includeData: true });
      return mode === "full" ? execution : summarizeExecution(execution);
    },
  });

  defineTool(server, ctx, {
    name: "n8n_delete_execution",
    title: "Delete execution",
    description: "Delete an execution and its data. This cannot be undone.",
    inputSchema: { id: idParam("Execution id") },
    mutates: true,
    destructive: true,
    idempotent: true,
    handler: async ({ id }, { client }) => {
      await client.delete(`executions/${encodeURIComponent(id)}`);
      return { deleted: true, id };
    },
  });

  defineTool(server, ctx, {
    name: "n8n_retry_execution",
    title: "Retry execution",
    description: "Retry a failed execution with its original input.",
    inputSchema: {
      id: idParam("Execution id"),
      loadWorkflow: z
        .boolean()
        .default(false)
        .describe("true: run with the current saved workflow; false: with the workflow as it was when it failed"),
    },
    mutates: true,
    handler: async ({ id, loadWorkflow }, { client }) =>
      summarizeExecution(await client.post<Json>(`executions/${encodeURIComponent(id)}/retry`, { loadWorkflow })),
  });

  defineTool(server, ctx, {
    name: "n8n_stop_execution",
    title: "Stop execution",
    description: "Stop a running or waiting execution (n8n 2.x).",
    inputSchema: { id: idParam("Execution id") },
    mutates: true,
    idempotent: true,
    handler: async ({ id }, { client }) =>
      summarizeExecution(await client.post<Json>(`executions/${encodeURIComponent(id)}/stop`)),
  });

  defineTool(server, ctx, {
    name: "n8n_trigger_webhook",
    title: "Trigger workflow webhook",
    description:
      "Run a workflow by calling its Webhook trigger (the n8n API has no generic 'run workflow' endpoint). " +
      "Find the path and method with n8n_get_workflow (mode summary). Production webhooks (test=false) need the " +
      "workflow to be active; test webhooks (test=true) only answer while 'Listen for test event' is open in the editor.",
    inputSchema: {
      path: z.string().min(1).describe('Webhook path as configured in the Webhook node, e.g. "new-lead"'),
      method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]).default("POST").describe("HTTP method"),
      body: z.unknown().optional().describe("Request body; objects are sent as JSON, strings as text"),
      query: z.record(z.string(), z.string()).optional().describe("Query string parameters"),
      headers: z
        .record(z.string(), z.string())
        .optional()
        .describe("Extra headers, e.g. the auth header the Webhook node expects"),
      test: z.boolean().default(false).describe("Call the test URL (/webhook-test/…) instead of production (/webhook/…)"),
    },
    mutates: true,
    openWorld: true,
    handler: async ({ path, method, body, query, headers, test }, { client }) =>
      client.callWebhook({ path, method: method as HttpMethod, body, query, headers, test }),
  });
}
