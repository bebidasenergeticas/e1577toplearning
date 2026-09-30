import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Page } from "../n8n-client.js";
import type { Json } from "../workflow-edits.js";
import { defineTool, type ToolContext } from "./define.js";
import { cursorParam, idParam, limitParam } from "./params.js";

/** Credentials, tags, variables, projects, users and the security audit. */
export function registerAdminTools(server: McpServer, ctx: ToolContext): void {
  // Credentials. The API never returns secret values.
  defineTool(server, ctx, {
    name: "n8n_list_credentials",
    title: "List credentials",
    description:
      "List credentials (id, name, type, projects) without their secrets. Requires an owner or admin API key on n8n 2.x.",
    inputSchema: { limit: limitParam, cursor: cursorParam },
    mutates: false,
    handler: async ({ limit, cursor }, { client }) => {
      const page = await client.get<Page<Json>>("credentials", { limit, cursor });
      return { credentials: page.data, nextCursor: page.nextCursor ?? null };
    },
  });

  defineTool(server, ctx, {
    name: "n8n_test_credential",
    title: "Test credential",
    description: "Check that a stored credential can connect to its service (n8n 2.x). Returns status OK or Error.",
    inputSchema: { id: idParam("Credential id") },
    mutates: false,
    openWorld: true,
    handler: async ({ id }, { client }) => client.post(`credentials/${encodeURIComponent(id)}/test`),
  });

  defineTool(server, ctx, {
    name: "n8n_get_credential_schema",
    title: "Get credential schema",
    description:
      "Get the JSON schema of the `data` a credential type needs (e.g. slackApi, httpHeaderAuth, googleSheetsOAuth2Api). " +
      "Call this before n8n_create_credential.",
    inputSchema: { credentialType: z.string().min(1).describe('Credential type name, e.g. "httpHeaderAuth"') },
    mutates: false,
    handler: async ({ credentialType }, { client }) =>
      client.get(`credentials/schema/${encodeURIComponent(credentialType)}`),
  });

  defineTool(server, ctx, {
    name: "n8n_create_credential",
    title: "Create credential",
    description:
      "Create a credential that workflow nodes can use. `data` must follow the schema from n8n_get_credential_schema. " +
      "Returns the new credential id to reference from nodes as credentials: {<type>: {id, name}}.",
    inputSchema: {
      name: z.string().min(1).describe("Display name"),
      type: z.string().min(1).describe('Credential type name, e.g. "httpHeaderAuth"'),
      data: z.record(z.string(), z.unknown()).describe("Secret values, e.g. {name: 'Authorization', value: 'Bearer …'}"),
    },
    mutates: true,
    handler: async ({ name, type, data }, { client }) => {
      const created = await client.post<Json>("credentials", { name, type, data });
      return { id: created.id, name: created.name, type: created.type, createdAt: created.createdAt };
    },
  });

  defineTool(server, ctx, {
    name: "n8n_update_credential",
    title: "Update credential",
    description:
      "Rename a credential or change its secret values (n8n 2.x). By default only the `data` fields you pass are " +
      "changed and the rest are kept.",
    inputSchema: {
      id: idParam("Credential id"),
      name: z.string().min(1).optional().describe("New display name"),
      data: z.record(z.string(), z.unknown()).optional().describe("Secret values to set"),
      replaceData: z
        .boolean()
        .default(false)
        .describe("true: `data` replaces all stored values; false: it is merged into them"),
    },
    mutates: true,
    destructive: true,
    idempotent: true,
    handler: async ({ id, name, data, replaceData }, { client }) => {
      const body: Json = {};
      if (name !== undefined) body.name = name;
      if (data !== undefined) {
        body.data = data;
        body.isPartialData = !replaceData;
      }
      const updated = await client.patch<Json>(`credentials/${encodeURIComponent(id)}`, body);
      return { id: updated.id, name: updated.name, type: updated.type, updatedAt: updated.updatedAt };
    },
  });

  defineTool(server, ctx, {
    name: "n8n_delete_credential",
    title: "Delete credential",
    description: "Delete a credential. Workflows that use it will fail until they get another one.",
    inputSchema: { id: idParam("Credential id") },
    mutates: true,
    destructive: true,
    idempotent: true,
    handler: async ({ id }, { client }) => {
      await client.delete(`credentials/${encodeURIComponent(id)}`);
      return { deleted: true, id };
    },
  });

  defineTool(server, ctx, {
    name: "n8n_transfer_credential",
    title: "Transfer credential",
    description: "Move a credential to another project.",
    inputSchema: {
      id: idParam("Credential id"),
      destinationProjectId: z.string().min(1).describe("Id of the project to move the credential to"),
    },
    mutates: true,
    idempotent: true,
    handler: async ({ id, destinationProjectId }, { client }) => {
      await client.put(`credentials/${encodeURIComponent(id)}/transfer`, { destinationProjectId });
      return { transferred: true, id, destinationProjectId };
    },
  });

  // Tags
  defineTool(server, ctx, {
    name: "n8n_list_tags",
    title: "List tags",
    description: "List workflow tags with their ids.",
    inputSchema: { limit: limitParam, cursor: cursorParam },
    mutates: false,
    handler: async ({ limit, cursor }, { client }) => {
      const page = await client.get<Page<Json>>("tags", { limit, cursor });
      return { tags: page.data, nextCursor: page.nextCursor ?? null };
    },
  });

  defineTool(server, ctx, {
    name: "n8n_create_tag",
    title: "Create tag",
    description: "Create a workflow tag.",
    inputSchema: { name: z.string().min(1).describe("Tag name") },
    mutates: true,
    handler: async ({ name }, { client }) => client.post("tags", { name }),
  });

  defineTool(server, ctx, {
    name: "n8n_update_tag",
    title: "Rename tag",
    description: "Rename a workflow tag.",
    inputSchema: { id: idParam("Tag id"), name: z.string().min(1).describe("New tag name") },
    mutates: true,
    idempotent: true,
    handler: async ({ id, name }, { client }) => client.put(`tags/${encodeURIComponent(id)}`, { name }),
  });

  defineTool(server, ctx, {
    name: "n8n_delete_tag",
    title: "Delete tag",
    description: "Delete a tag. Workflows keep working but lose the tag.",
    inputSchema: { id: idParam("Tag id") },
    mutates: true,
    destructive: true,
    idempotent: true,
    handler: async ({ id }, { client }) => {
      await client.delete(`tags/${encodeURIComponent(id)}`);
      return { deleted: true, id };
    },
  });

  // Variables (available on n8n plans that include variables)
  defineTool(server, ctx, {
    name: "n8n_list_variables",
    title: "List variables",
    description: "List instance variables (used in workflows as $vars.<key>).",
    inputSchema: { limit: limitParam, cursor: cursorParam },
    mutates: false,
    handler: async ({ limit, cursor }, { client }) => {
      const page = await client.get<Page<Json>>("variables", { limit, cursor });
      return { variables: page.data, nextCursor: page.nextCursor ?? null };
    },
  });

  defineTool(server, ctx, {
    name: "n8n_create_variable",
    title: "Create variable",
    description: "Create an instance variable, available in workflows as $vars.<key>.",
    inputSchema: {
      key: z
        .string()
        .regex(/^[A-Za-z0-9_]+$/, "Only letters, digits and underscores")
        .describe("Variable name"),
      value: z.string().describe("Variable value"),
    },
    mutates: true,
    handler: async ({ key, value }, { client }) => {
      await client.post("variables", { key, value });
      return { created: true, key };
    },
  });

  defineTool(server, ctx, {
    name: "n8n_delete_variable",
    title: "Delete variable",
    description: "Delete an instance variable by id (see n8n_list_variables).",
    inputSchema: { id: idParam("Variable id") },
    mutates: true,
    destructive: true,
    idempotent: true,
    handler: async ({ id }, { client }) => {
      await client.delete(`variables/${encodeURIComponent(id)}`);
      return { deleted: true, id };
    },
  });

  // Projects (available on n8n plans that include projects)
  defineTool(server, ctx, {
    name: "n8n_list_projects",
    title: "List projects",
    description: "List projects, whose ids can be used to filter workflows and executions.",
    inputSchema: { limit: limitParam, cursor: cursorParam },
    mutates: false,
    handler: async ({ limit, cursor }, { client }) => {
      const page = await client.get<Page<Json>>("projects", { limit, cursor });
      return { projects: page.data, nextCursor: page.nextCursor ?? null };
    },
  });

  // Users (read-only here on purpose: inviting or deleting people is left to the n8n UI)
  defineTool(server, ctx, {
    name: "n8n_list_users",
    title: "List users",
    description: "List the users of the instance (requires an owner or admin API key).",
    inputSchema: {
      includeRole: z.boolean().default(true).describe("Include each user's role"),
      projectId: z.string().optional().describe("Only members of this project"),
      limit: limitParam,
      cursor: cursorParam,
    },
    mutates: false,
    handler: async ({ includeRole, projectId, limit, cursor }, { client }) => {
      const page = await client.get<Page<Json>>("users", { includeRole, projectId, limit, cursor });
      return { users: page.data, nextCursor: page.nextCursor ?? null };
    },
  });

  // Audit
  defineTool(server, ctx, {
    name: "n8n_generate_audit",
    title: "Generate security audit",
    description:
      "Run n8n's security audit: risky credentials, database queries, nodes, filesystem access and instance settings.",
    inputSchema: {
      categories: z
        .array(z.enum(["credentials", "database", "nodes", "filesystem", "instance"]))
        .optional()
        .describe("Categories to include (default: all)"),
      daysAbandonedWorkflow: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe("Days without executions after which a workflow counts as abandoned"),
    },
    mutates: false,
    handler: async ({ categories, daysAbandonedWorkflow }, { client }) => {
      const additionalOptions: Json = {};
      if (categories) additionalOptions.categories = categories;
      if (daysAbandonedWorkflow) additionalOptions.daysAbandonedWorkflow = daysAbandonedWorkflow;
      return client.post("audit", Object.keys(additionalOptions).length > 0 ? { additionalOptions } : {});
    },
  });
}
