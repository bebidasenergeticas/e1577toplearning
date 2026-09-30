import { describe, expect, it } from "vitest";
import { summarizeExecution, summarizeWorkflow } from "../src/summaries.js";

describe("summarizeWorkflow", () => {
  it("lists triggers and webhook endpoints without node parameters", () => {
    const summary = summarizeWorkflow({
      id: "1",
      name: "Leads",
      active: true,
      tags: [{ id: "t", name: "crm" }],
      nodes: [
        { name: "Hook", type: "n8n-nodes-base.webhook", parameters: { path: "lead", httpMethod: "POST" } },
        { name: "Every day", type: "n8n-nodes-base.scheduleTrigger", parameters: {} },
        { name: "Old", type: "n8n-nodes-base.webhook", parameters: { path: "old" }, disabled: true },
        { name: "HTTP", type: "n8n-nodes-base.httpRequest", parameters: { url: "https://x" } },
      ],
    });
    expect(summary).toMatchObject({
      id: "1",
      name: "Leads",
      active: true,
      tags: ["crm"],
      nodeCount: 4,
      triggers: ["n8n-nodes-base.webhook", "n8n-nodes-base.scheduleTrigger", "n8n-nodes-base.webhook"],
      webhooks: [{ node: "Hook", method: "POST", path: "lead" }],
    });
    expect(JSON.stringify(summary)).not.toContain("https://x");
  });
});

describe("summarizeExecution", () => {
  const execution = {
    id: "7",
    workflowId: "1",
    status: "error",
    mode: "webhook",
    finished: false,
    startedAt: "2026-01-01T00:00:00.000Z",
    stoppedAt: "2026-01-01T00:00:01.500Z",
    data: {
      resultData: {
        lastNodeExecuted: "Code",
        error: { message: "boom", node: { name: "Code" } },
        runData: {
          Webhook: [
            {
              executionTime: 2,
              executionStatus: "success",
              data: { main: [[{ json: { body: { x: 1 } } }, { json: { body: { x: 2 } } }]] },
            },
          ],
          Code: [{ executionTime: 5, executionStatus: "error", error: { message: "boom", description: "at line 1" } }],
        },
      },
    },
  };

  it("summarizes the error and each node's output", () => {
    expect(summarizeExecution(execution)).toEqual({
      id: "7",
      workflowId: "1",
      status: "error",
      mode: "webhook",
      finished: false,
      startedAt: "2026-01-01T00:00:00.000Z",
      stoppedAt: "2026-01-01T00:00:01.500Z",
      durationMs: 1500,
      retryOf: undefined,
      retrySuccessId: undefined,
      waitTill: undefined,
      error: { message: "boom", description: undefined, node: "Code" },
      lastNodeExecuted: "Code",
      nodes: [
        {
          node: "Webhook",
          runs: 1,
          status: "success",
          items: 2,
          executionTimeMs: 2,
          error: undefined,
          firstItem: { body: { x: 1 } },
        },
        {
          node: "Code",
          runs: 1,
          status: "error",
          items: 0,
          executionTimeMs: 5,
          error: { message: "boom", description: "at line 1", node: undefined },
          firstItem: undefined,
        },
      ],
    });
  });

  it("accepts execution data serialized as a string and truncates large items", () => {
    const big = { ...execution, data: JSON.stringify(execution.data).replace('"x":1', `"x":"${"a".repeat(5000)}"`) };
    const summary = summarizeExecution(big, 100) as { nodes: Array<{ firstItem: unknown }> };
    expect(typeof summary.nodes[0]?.firstItem).toBe("string");
    expect(String(summary.nodes[0]?.firstItem)).toMatch(/… \[truncated\]$/);
  });

  it("works without execution data", () => {
    expect(summarizeExecution({ id: "1", status: "success" })).not.toHaveProperty("nodes");
  });
});
