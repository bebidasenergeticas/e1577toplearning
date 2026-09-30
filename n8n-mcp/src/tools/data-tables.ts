import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Page } from "../n8n-client.js";
import type { Json } from "../workflow-edits.js";
import { defineTool, type ToolContext } from "./define.js";
import { cursorParam, idParam, limitParam } from "./params.js";

// Data tables are n8n's built-in tables (n8n 2.x), readable and writable from workflows.

const rowFilterSchema = z
  .object({
    type: z.enum(["and", "or"]).default("and").describe("How to combine the conditions"),
    filters: z
      .array(
        z.object({
          columnName: z.string().describe("Column to compare"),
          condition: z.enum(["eq", "neq", "like", "ilike", "gt", "gte", "lt", "lte"]).describe("Comparison"),
          value: z.unknown().describe("Value to compare with; like/ilike use % as wildcard"),
        }),
      )
      .min(1),
  })
  .describe('Row filter, e.g. {"type": "and", "filters": [{"columnName": "status", "condition": "eq", "value": "new"}]}');

const tableIdParam = idParam("Data table id (see n8n_list_data_tables)");

const tablePath = (id: string, suffix = "") => `data-tables/${encodeURIComponent(id)}${suffix}`;

export function registerDataTableTools(server: McpServer, ctx: ToolContext): void {
  defineTool(server, ctx, {
    name: "n8n_list_data_tables",
    title: "List data tables",
    description: "List n8n data tables with their columns (n8n 2.x).",
    inputSchema: {
      name: z.string().optional().describe("Only tables with this name"),
      limit: limitParam,
      cursor: cursorParam,
    },
    mutates: false,
    handler: async ({ name, limit, cursor }, { client }) => {
      const filter = name ? JSON.stringify({ name }) : undefined;
      const page = await client.get<Page<Json>>("data-tables", { filter, limit, cursor });
      return { dataTables: page.data, nextCursor: page.nextCursor ?? null };
    },
  });

  defineTool(server, ctx, {
    name: "n8n_create_data_table",
    title: "Create data table",
    description: "Create a data table with typed columns (n8n 2.x).",
    inputSchema: {
      name: z.string().min(1).max(128).describe("Table name"),
      columns: z
        .array(
          z.object({
            name: z.string().min(1).describe("Column name"),
            type: z.enum(["string", "number", "boolean", "date", "json"]).describe("Column type"),
          }),
        )
        .describe("Columns (id, createdAt and updatedAt are added automatically)"),
      projectId: z.string().optional().describe("Project to create it in (default: your personal project)"),
    },
    mutates: true,
    handler: async ({ name, columns, projectId }, { client }) => client.post("data-tables", { name, columns, projectId }),
  });

  defineTool(server, ctx, {
    name: "n8n_get_data_table_rows",
    title: "Get data table rows",
    description: "Read rows from a data table, optionally filtered, searched and sorted (n8n 2.x).",
    inputSchema: {
      dataTableId: tableIdParam,
      filter: rowFilterSchema.optional(),
      search: z.string().optional().describe("Text to search for in all string columns"),
      sortBy: z.string().optional().describe('Sort order, e.g. "createdAt:desc"'),
      limit: limitParam,
      cursor: cursorParam,
    },
    mutates: false,
    handler: async ({ dataTableId, filter, search, sortBy, limit, cursor }, { client }) => {
      const page = await client.get<Page<Json>>(tablePath(dataTableId, "/rows"), {
        filter: filter ? JSON.stringify(filter) : undefined,
        search,
        sortBy,
        limit,
        cursor,
      });
      return { rows: page.data, nextCursor: page.nextCursor ?? null };
    },
  });

  defineTool(server, ctx, {
    name: "n8n_insert_data_table_rows",
    title: "Insert data table rows",
    description: "Insert rows into a data table (n8n 2.x). Each row is an object keyed by column name.",
    inputSchema: {
      dataTableId: tableIdParam,
      rows: z.array(z.record(z.string(), z.unknown())).min(1).describe("Rows to insert"),
      returnType: z.enum(["count", "id", "all"]).default("id").describe("What to return about the inserted rows"),
    },
    mutates: true,
    handler: async ({ dataTableId, rows, returnType }, { client }) =>
      client.post(tablePath(dataTableId, "/rows"), { data: rows, returnType }),
  });

  defineTool(server, ctx, {
    name: "n8n_update_data_table_rows",
    title: "Update or upsert data table rows",
    description:
      "Set column values on the rows matching a filter (n8n 2.x). With upsert=true a new row is inserted when none " +
      "matches. Use dryRun=true to preview which rows would change.",
    inputSchema: {
      dataTableId: tableIdParam,
      filter: rowFilterSchema,
      data: z.record(z.string(), z.unknown()).describe("Column values to set"),
      upsert: z.boolean().default(false).describe("Insert a row when no row matches the filter"),
      dryRun: z.boolean().default(false).describe("Preview only, do not save"),
    },
    mutates: true,
    destructive: true,
    idempotent: true,
    handler: async ({ dataTableId, filter, data, upsert, dryRun }, { client }) => {
      const body = { filter, data, dryRun, returnData: true };
      return upsert
        ? client.post(tablePath(dataTableId, "/rows/upsert"), body)
        : client.patch(tablePath(dataTableId, "/rows/update"), body);
    },
  });

  defineTool(server, ctx, {
    name: "n8n_delete_data_table_rows",
    title: "Delete data table rows",
    description: "Delete the rows matching a filter (n8n 2.x). Use dryRun=true first to see which rows would go.",
    inputSchema: {
      dataTableId: tableIdParam,
      filter: rowFilterSchema,
      dryRun: z.boolean().default(false).describe("Preview only, do not delete"),
    },
    mutates: true,
    destructive: true,
    idempotent: true,
    handler: async ({ dataTableId, filter, dryRun }, { client }) =>
      client.request("DELETE", tablePath(dataTableId, "/rows/delete"), {
        query: { filter: JSON.stringify(filter), dryRun, returnData: true },
      }),
  });
}
