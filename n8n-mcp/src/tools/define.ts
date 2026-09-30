import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ShapeOutput, ZodRawShapeCompat } from "@modelcontextprotocol/sdk/server/zod-compat.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Config } from "../config.js";
import { errorMessage, type N8nClient } from "../n8n-client.js";

export interface ToolContext {
  client: N8nClient;
  config: Config;
}

export interface ToolSpec<Shape extends ZodRawShapeCompat> {
  name: string;
  title: string;
  description: string;
  inputSchema: Shape;
  /** Whether the tool changes anything in n8n. Such tools are hidden in read-only mode. */
  mutates: boolean;
  /** Whether the change deletes or overwrites data that cannot be recovered. */
  destructive?: boolean;
  /** Whether calling the tool twice with the same arguments has no additional effect. */
  idempotent?: boolean;
  /** Whether the tool talks to something other than the n8n API (e.g. a workflow's webhook). */
  openWorld?: boolean;
  handler: (args: ShapeOutput<Shape>, ctx: ToolContext) => Promise<unknown>;
}

export function formatResult(value: unknown, maxChars: number): string {
  const text = typeof value === "string" ? value : (JSON.stringify(value, null, 2) ?? "null");
  if (text.length <= maxChars) return text;
  return (
    `${text.slice(0, maxChars)}\n\n… [truncated: the response was ${text.length} characters, ` +
    `showing the first ${maxChars}. Narrow the request (filters, smaller limit, summary mode) to see the rest.]`
  );
}

export function defineTool<Shape extends ZodRawShapeCompat>(
  server: McpServer,
  ctx: ToolContext,
  spec: ToolSpec<Shape>,
): void {
  if (ctx.config.readOnly && spec.mutates) return;

  const callback = async (args: ShapeOutput<Shape>): Promise<CallToolResult> => {
    try {
      const result = await spec.handler(args, ctx);
      return { content: [{ type: "text", text: formatResult(result ?? { success: true }, ctx.config.maxResponseChars) }] };
    } catch (error) {
      return { content: [{ type: "text", text: errorMessage(error) }], isError: true };
    }
  };

  server.registerTool(
    spec.name,
    {
      title: spec.title,
      description: spec.description,
      inputSchema: spec.inputSchema,
      annotations: {
        title: spec.title,
        readOnlyHint: !spec.mutates,
        destructiveHint: spec.mutates ? (spec.destructive ?? false) : undefined,
        idempotentHint: spec.mutates ? (spec.idempotent ?? false) : undefined,
        openWorldHint: spec.openWorld ?? false,
      },
    },
    // The SDK infers the callback type from the shape; the wrapper above has the same signature.
    callback as never,
  );
}
