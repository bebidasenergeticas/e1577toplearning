import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { N8nApiError, type Page } from "../n8n-client.js";
import { summarizeWorkflow, webhookEndpoints } from "../summaries.js";
import { applyEdits, type Connections, type EditOperation, type Json } from "../workflow-edits.js";
import { defineTool, type ToolContext } from "./define.js";
import { cursorParam, idParam, limitParam } from "./params.js";

/** Settings keys accepted by the public API; used only as a fallback when n8n rejects the stored settings. */
const KNOWN_SETTINGS = [
  "saveExecutionProgress",
  "saveManualExecutions",
  "saveDataErrorExecution",
  "saveDataSuccessExecution",
  "executionTimeout",
  "errorWorkflow",
  "timezone",
  "executionOrder",
  "callerPolicy",
  "callerIds",
  "timeSavedMode",
  "timeSavedPerExecution",
  "availableInMCP",
];

const nodeSchema = z
  .object({
    name: z.string().describe("Unique node name within the workflow, used by connections"),
    type: z.string().describe('Node type, e.g. "n8n-nodes-base.httpRequest" or "n8n-nodes-base.webhook"'),
    typeVersion: z.number().describe("Version of the node type, e.g. 4.2"),
    position: z.array(z.number()).length(2).describe("[x, y] position on the canvas"),
    parameters: z.record(z.string(), z.unknown()).describe("Node parameters as shown in the workflow JSON"),
  })
  .passthrough()
  .describe("A workflow node; extra fields such as id, credentials, disabled or webhookId are kept");

const connectionsSchema = z
  .record(z.string(), z.unknown())
  .describe(
    'Connections keyed by source node name: {"Source": {"main": [[{"node": "Target", "type": "main", "index": 0}]]}}',
  );

const settingsSchema = z
  .record(z.string(), z.unknown())
  .describe('Workflow settings, e.g. {"executionOrder": "v1", "timezone": "Europe/Madrid"}');

interface WorkflowBody {
  name: unknown;
  nodes: unknown;
  connections: unknown;
  settings: unknown;
  staticData?: unknown;
  description?: unknown;
  projectId?: unknown;
}

/**
 * The API rejects read-only fields (id, active, tags, …) in request bodies, so only send the writable ones.
 * Optional fields that are left out (description, pinData, …) keep their stored value on update.
 */
function writableFields(workflow: Json, optional: Array<"description" | "projectId"> = []): WorkflowBody {
  const body: WorkflowBody = {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: workflow.settings ?? {},
  };
  if (workflow.staticData !== undefined && workflow.staticData !== null) body.staticData = workflow.staticData;
  for (const key of optional) {
    if (workflow[key] !== undefined) body[key] = workflow[key];
  }
  return body;
}

function isSettingsRejection(error: unknown): boolean {
  return error instanceof N8nApiError && error.status === 400 && /settings/i.test(error.message);
}

async function putWorkflow(ctx: ToolContext, id: string, body: WorkflowBody, publishIfActive?: boolean): Promise<Json> {
  // Only send publishIfActive when asked: older n8n versions reject unknown query parameters.
  const put = (payload: WorkflowBody) =>
    ctx.client.request<Json>("PUT", `workflows/${encodeURIComponent(id)}`, { body: payload, query: { publishIfActive } });
  try {
    return await put(body);
  } catch (error) {
    // Some n8n versions return settings keys from GET that their own PUT validation rejects.
    if (!isSettingsRejection(error) || typeof body.settings !== "object" || body.settings === null) throw error;
    const settings = Object.fromEntries(
      Object.entries(body.settings as Json).filter(([key]) => KNOWN_SETTINGS.includes(key)),
    );
    return put({ ...body, settings });
  }
}

/** n8n 2.x renamed activate/deactivate to publish/unpublish; the old routes are deprecated but n8n 1.x only has those. */
async function postWithFallback(ctx: ToolContext, id: string, action: string, legacyAction: string): Promise<Json> {
  const base = `workflows/${encodeURIComponent(id)}`;
  try {
    return await ctx.client.post<Json>(`${base}/${action}`);
  } catch (error) {
    if (!(error instanceof N8nApiError) || (error.status !== 404 && error.status !== 405)) throw error;
    return ctx.client.post<Json>(`${base}/${legacyAction}`);
  }
}

const publishIfActiveParam = z
  .boolean()
  .optional()
  .describe(
    "Only for published (active) workflows on n8n 2.x: false saves the change as a draft instead of publishing it " +
      "right away. Default: n8n publishes the change.",
  );

/** What create/update/edit return: enough to confirm the change without echoing every node parameter. */
function describeSaved(workflow: Json, includeConnections = false): Json {
  const nodes = Array.isArray(workflow.nodes) ? (workflow.nodes as Json[]) : [];
  return {
    ...summarizeWorkflow(workflow),
    description: workflow.description ?? undefined,
    nodes: nodes.map((node) => ({ name: node.name, type: node.type })),
    connections: includeConnections ? workflow.connections : undefined,
  };
}

function getWorkflow(ctx: ToolContext, id: string): Promise<Json> {
  return ctx.client.get<Json>(`workflows/${encodeURIComponent(id)}`);
}

const editOperationSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("addNode"),
    node: z
      .record(z.string(), z.unknown())
      .describe("Node to add; name and type are required, id/typeVersion/position/parameters get defaults"),
  }),
  z.object({
    op: z.literal("updateNode"),
    name: z.string().describe("Current name of the node"),
    changes: z
      .record(z.string(), z.unknown())
      .describe(
        "Fields to change. Objects are merged deeply (e.g. {parameters: {url: '…'}} keeps other parameters); " +
          "arrays and scalars are replaced. Setting name renames the node and updates its connections.",
      ),
  }),
  z.object({
    op: z.literal("removeNode"),
    name: z.string().describe("Name of the node to delete; its connections are removed too"),
  }),
  z.object({
    op: z.literal("addConnection"),
    from: z.string().describe("Source node name"),
    to: z.string().describe("Target node name"),
    fromOutput: z.number().int().min(0).optional().describe("Output index of the source (default 0; IF true=0, false=1)"),
    toInput: z.number().int().min(0).optional().describe("Input index of the target (default 0)"),
    type: z.string().optional().describe('Connection type (default "main"; AI nodes use e.g. "ai_languageModel")'),
  }),
  z.object({
    op: z.literal("removeConnection"),
    from: z.string().describe("Source node name"),
    to: z.string().describe("Target node name"),
    fromOutput: z.number().int().min(0).optional().describe("Only remove from this output index"),
    toInput: z.number().int().min(0).optional().describe("Only remove the connection to this input index"),
    type: z.string().optional().describe('Connection type (default "main")'),
  }),
]);

export function registerWorkflowTools(server: McpServer, ctx: ToolContext): void {
  defineTool(server, ctx, {
    name: "n8n_list_workflows",
    title: "List workflows",
    description:
      "List workflows with a compact summary of each (id, name, active, tags, trigger types, webhook paths). " +
      "Use n8n_get_workflow to see the full definition of one workflow.",
    inputSchema: {
      active: z.boolean().optional().describe("Only active (true) or inactive (false) workflows"),
      name: z.string().optional().describe("Filter by workflow name"),
      tags: z.string().optional().describe('Comma-separated tag names, e.g. "prod,crm"'),
      projectId: z.string().optional().describe("Only workflows in this project"),
      limit: limitParam,
      cursor: cursorParam,
    },
    mutates: false,
    handler: async ({ active, name, tags, projectId, limit, cursor }, { client }) => {
      const page = await client.get<Page<Json>>("workflows", {
        active,
        name,
        tags,
        projectId,
        limit,
        cursor,
        excludePinnedData: true,
      });
      return { workflows: page.data.map(summarizeWorkflow), nextCursor: page.nextCursor ?? null };
    },
  });

  defineTool(server, ctx, {
    name: "n8n_get_workflow",
    title: "Get workflow",
    description:
      "Get a workflow by id. mode 'full' returns the complete JSON (nodes with parameters, connections, settings); " +
      "mode 'summary' returns node names/types and webhook endpoints only. Pass versionId (from " +
      "n8n_list_workflow_versions) to see an earlier version.",
    inputSchema: {
      id: idParam("Workflow id"),
      mode: z.enum(["full", "summary"]).default("full").describe("Level of detail"),
      versionId: z.string().optional().describe("A version from n8n_list_workflow_versions (n8n 2.x); default: current"),
      excludePinnedData: z.boolean().default(true).describe("Leave out pinned test data"),
    },
    mutates: false,
    handler: async ({ id, mode, versionId, excludePinnedData }, { client }) => {
      const workflow = versionId
        ? await client.get<Json>(`workflows/${encodeURIComponent(id)}/${encodeURIComponent(versionId)}`)
        : await client.get<Json>(`workflows/${encodeURIComponent(id)}`, { excludePinnedData });
      if (mode === "full") return workflow;
      const nodes = Array.isArray(workflow.nodes) ? (workflow.nodes as Json[]) : [];
      return {
        ...summarizeWorkflow(workflow),
        nodes: nodes.map((node) => ({ name: node.name, type: node.type, disabled: node.disabled || undefined })),
        webhooks: webhookEndpoints(workflow),
        connections: workflow.connections,
      };
    },
  });

  defineTool(server, ctx, {
    name: "n8n_list_workflow_versions",
    title: "List workflow versions",
    description:
      "List the saved versions of a workflow, newest first (n8n 2.x). To roll back, read an old version with " +
      "n8n_get_workflow(versionId) and save its nodes and connections with n8n_update_workflow.",
    inputSchema: { id: idParam("Workflow id"), limit: limitParam, cursor: cursorParam },
    mutates: false,
    handler: async ({ id, limit, cursor }, { client }) => {
      const page = await client.get<Page<Json>>(`workflows/${encodeURIComponent(id)}/history`, { limit, cursor });
      return { versions: page.data, nextCursor: page.nextCursor ?? null };
    },
  });

  defineTool(server, ctx, {
    name: "n8n_create_workflow",
    title: "Create workflow",
    description:
      "Create a new, unpublished workflow from nodes and connections. Node names must be unique and connections " +
      "refer to nodes by name. Publish it afterwards with n8n_activate_workflow.",
    inputSchema: {
      name: z.string().min(1).describe("Workflow name"),
      nodes: z.array(nodeSchema).describe("Workflow nodes"),
      connections: connectionsSchema.default({}),
      settings: settingsSchema.default({ executionOrder: "v1" }),
      staticData: z.record(z.string(), z.unknown()).optional().describe("Static data (rarely needed)"),
      projectId: z.string().optional().describe("Project to create it in (default: your personal project)"),
    },
    mutates: true,
    handler: async (args, { client }) =>
      describeSaved(await client.post<Json>("workflows", writableFields(args as Json, ["projectId"]))),
  });

  defineTool(server, ctx, {
    name: "n8n_update_workflow",
    title: "Update workflow",
    description:
      "Replace top-level parts of a workflow. Only the fields you pass are changed (e.g. pass just `name` to rename); " +
      "`nodes` and `connections` replace the existing ones entirely, so for small changes prefer n8n_edit_workflow.",
    inputSchema: {
      id: idParam("Workflow id"),
      name: z.string().min(1).optional().describe("New workflow name"),
      description: z.string().optional().describe("New workflow description (n8n 2.x)"),
      nodes: z.array(nodeSchema).optional().describe("Complete new list of nodes"),
      connections: connectionsSchema.optional(),
      settings: settingsSchema.optional(),
      staticData: z.record(z.string(), z.unknown()).optional().describe("Static data"),
      publishIfActive: publishIfActiveParam,
    },
    mutates: true,
    destructive: true,
    idempotent: true,
    handler: async ({ id, publishIfActive, ...changes }, ctx) => {
      const current = await getWorkflow(ctx, id);
      const defined = Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined));
      // description is only sent when given, so n8n versions without it keep working.
      const body = writableFields({ ...current, description: undefined, ...defined }, ["description"]);
      return describeSaved(await putWorkflow(ctx, id, body, publishIfActive));
    },
  });

  defineTool(server, ctx, {
    name: "n8n_edit_workflow",
    title: "Edit workflow nodes and connections",
    description:
      "Apply a list of targeted edits to a workflow in one save: addNode, updateNode (deep-merges changes, can rename), " +
      "removeNode, addConnection and removeConnection. Operations run in order and nothing is saved if any fails.",
    inputSchema: {
      id: idParam("Workflow id"),
      operations: z.array(editOperationSchema).min(1).describe("Edits to apply, in order"),
      publishIfActive: publishIfActiveParam,
    },
    mutates: true,
    destructive: true,
    handler: async ({ id, operations, publishIfActive }, ctx) => {
      const current = await getWorkflow(ctx, id);
      const graph = applyEdits(
        {
          nodes: Array.isArray(current.nodes) ? (current.nodes as Json[]) : [],
          connections: (current.connections ?? {}) as Connections,
        },
        operations as EditOperation[],
      );
      const saved = await putWorkflow(ctx, id, writableFields({ ...current, ...graph }), publishIfActive);
      return { appliedOperations: operations.length, ...describeSaved(saved, true) };
    },
  });

  defineTool(server, ctx, {
    name: "n8n_delete_workflow",
    title: "Delete workflow",
    description:
      "Permanently delete a workflow. This cannot be undone; on n8n 2.x prefer n8n_archive_workflow, which can be reverted.",
    inputSchema: { id: idParam("Workflow id") },
    mutates: true,
    destructive: true,
    idempotent: true,
    handler: async ({ id }, { client }) => {
      const deleted = await client.delete<Json>(`workflows/${encodeURIComponent(id)}`);
      return { deleted: true, id, name: deleted?.name };
    },
  });

  defineTool(server, ctx, {
    name: "n8n_archive_workflow",
    title: "Archive or unarchive workflow",
    description: "Archive a workflow (hides and unpublishes it, reversible) or restore it from the archive (n8n 2.x).",
    inputSchema: {
      id: idParam("Workflow id"),
      archived: z.boolean().default(true).describe("true: archive; false: restore from the archive"),
    },
    mutates: true,
    idempotent: true,
    handler: async ({ id, archived }, { client }) =>
      summarizeWorkflow(await client.post<Json>(`workflows/${encodeURIComponent(id)}/${archived ? "archive" : "unarchive"}`)),
  });

  defineTool(server, ctx, {
    name: "n8n_activate_workflow",
    title: "Publish (activate) workflow",
    description:
      "Publish a workflow (called 'activate' before n8n 2.0) so its triggers run in production. " +
      "The workflow needs a trigger node.",
    inputSchema: { id: idParam("Workflow id") },
    mutates: true,
    idempotent: true,
    handler: async ({ id }, ctx) => summarizeWorkflow(await postWithFallback(ctx, id, "publish", "activate")),
  });

  defineTool(server, ctx, {
    name: "n8n_deactivate_workflow",
    title: "Unpublish (deactivate) workflow",
    description: "Unpublish a workflow (called 'deactivate' before n8n 2.0) so its production triggers stop running.",
    inputSchema: { id: idParam("Workflow id") },
    mutates: true,
    idempotent: true,
    handler: async ({ id }, ctx) => summarizeWorkflow(await postWithFallback(ctx, id, "unpublish", "deactivate")),
  });

  defineTool(server, ctx, {
    name: "n8n_set_workflow_tags",
    title: "Set workflow tags",
    description: "Replace the tags of a workflow. Use n8n_list_tags or n8n_create_tag to get tag ids.",
    inputSchema: {
      id: idParam("Workflow id"),
      tagIds: z.array(z.string()).describe("Ids of all tags the workflow should have (empty array removes all)"),
    },
    mutates: true,
    idempotent: true,
    handler: async ({ id, tagIds }, { client }) =>
      client.put(`workflows/${encodeURIComponent(id)}/tags`, tagIds.map((tagId) => ({ id: tagId }))),
  });

  defineTool(server, ctx, {
    name: "n8n_transfer_workflow",
    title: "Transfer workflow",
    description: "Move a workflow to another project.",
    inputSchema: {
      id: idParam("Workflow id"),
      destinationProjectId: z.string().min(1).describe("Id of the project to move the workflow to"),
    },
    mutates: true,
    idempotent: true,
    handler: async ({ id, destinationProjectId }, { client }) => {
      await client.put(`workflows/${encodeURIComponent(id)}/transfer`, { destinationProjectId });
      return { transferred: true, id, destinationProjectId };
    },
  });
}
