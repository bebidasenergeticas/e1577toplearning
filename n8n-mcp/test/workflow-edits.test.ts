import { describe, expect, it } from "vitest";
import { applyEdits, deepMerge, type WorkflowGraph } from "../src/workflow-edits.js";

const graph = (): WorkflowGraph => ({
  nodes: [
    { name: "Webhook", type: "n8n-nodes-base.webhook", parameters: { path: "a", httpMethod: "POST" } },
    { name: "IF", type: "n8n-nodes-base.if", parameters: {} },
    { name: "Slack", type: "n8n-nodes-base.slack", parameters: { channel: "#x", options: { a: 1 } } },
  ],
  connections: {
    Webhook: { main: [[{ node: "IF", type: "main", index: 0 }]] },
    IF: { main: [[{ node: "Slack", type: "main", index: 0 }], []] },
  },
});

describe("deepMerge", () => {
  it("merges nested objects and replaces arrays and scalars", () => {
    expect(deepMerge({ a: { b: 1, c: 2 }, list: [1, 2], s: "x" }, { a: { c: 3 }, list: [9], s: "y" })).toEqual({
      a: { b: 1, c: 3 },
      list: [9],
      s: "y",
    });
  });
});

describe("applyEdits", () => {
  it("adds a node with defaults and connects it", () => {
    const result = applyEdits(graph(), [
      { op: "addNode", node: { name: "Log", type: "n8n-nodes-base.noOp" } },
      { op: "addConnection", from: "IF", to: "Log", fromOutput: 1 },
    ]);
    const log = result.nodes.find((node) => node.name === "Log");
    expect(log).toMatchObject({ typeVersion: 1, position: [0, 0], parameters: {} });
    expect(typeof log?.id).toBe("string");
    expect(result.connections.IF.main[1]).toEqual([{ node: "Log", type: "main", index: 0 }]);
  });

  it("does not duplicate an existing connection", () => {
    const result = applyEdits(graph(), [{ op: "addConnection", from: "Webhook", to: "IF" }]);
    expect(result.connections.Webhook.main[0]).toHaveLength(1);
  });

  it("creates the output slots a new connection needs", () => {
    const result = applyEdits(graph(), [{ op: "addConnection", from: "Slack", to: "IF", fromOutput: 2 }]);
    expect(result.connections.Slack.main).toEqual([[], [], [{ node: "IF", type: "main", index: 0 }]]);
  });

  it("deep-merges node changes", () => {
    const result = applyEdits(graph(), [
      { op: "updateNode", name: "Slack", changes: { parameters: { options: { b: 2 } }, disabled: true } },
    ]);
    expect(result.nodes[2]).toMatchObject({
      disabled: true,
      parameters: { channel: "#x", options: { a: 1, b: 2 } },
    });
  });

  it("renames a node everywhere it is referenced", () => {
    const result = applyEdits(graph(), [{ op: "updateNode", name: "IF", changes: { name: "Check" } }]);
    expect(result.nodes.map((node) => node.name)).toEqual(["Webhook", "Check", "Slack"]);
    expect(result.connections.Webhook.main[0]?.[0]?.node).toBe("Check");
    expect(result.connections.Check).toBeDefined();
    expect(result.connections.IF).toBeUndefined();
  });

  it("removes a node and every connection to or from it", () => {
    const result = applyEdits(graph(), [{ op: "removeNode", name: "IF" }]);
    expect(result.nodes.map((node) => node.name)).toEqual(["Webhook", "Slack"]);
    expect(result.connections).toEqual({ Webhook: { main: [[]] } });
  });

  it("removes a single connection", () => {
    const result = applyEdits(graph(), [{ op: "removeConnection", from: "IF", to: "Slack" }]);
    expect(result.connections.IF.main).toEqual([[], []]);
  });

  it("reports which operation failed and leaves the input untouched", () => {
    const original = graph();
    expect(() =>
      applyEdits(original, [
        { op: "removeNode", name: "Slack" },
        { op: "updateNode", name: "Missing", changes: {} },
      ]),
    ).toThrow(/Operation #2 \(updateNode\) failed: Node "Missing" not found/);
    expect(original).toEqual(graph());
  });

  it("rejects duplicate node names", () => {
    expect(() => applyEdits(graph(), [{ op: "addNode", node: { name: "IF", type: "x" } }])).toThrow(/already exists/);
    expect(() => applyEdits(graph(), [{ op: "updateNode", name: "IF", changes: { name: "Slack" } }])).toThrow(
      /already used/,
    );
  });
});
