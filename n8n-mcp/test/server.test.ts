import { createServer as createHttpServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { Config } from "../src/config.js";
import { createServer } from "../src/server.js";
import { formatResult } from "../src/tools/define.js";

interface Recorded {
  method: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
}

type Route = (request: Recorded) => { status?: number; body?: unknown };

/** A stand-in for the n8n API that records requests and answers from `routes`. */
let routes: Record<string, Route> = {};
let requests: Recorded[] = [];
let fake: Server;
let baseUrl: string;

beforeAll(async () => {
  fake = createHttpServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const recorded: Recorded = {
      method: req.method ?? "GET",
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      headers: req.headers,
      body: raw ? JSON.parse(raw) : undefined,
    };
    requests.push(recorded);
    const route = routes[`${recorded.method} ${recorded.path}`];
    const { status = 200, body = {} } = route ? route(recorded) : { status: 404, body: { message: "Not Found" } };
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  });
  await new Promise<void>((resolve) => fake.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${(fake.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((resolve) => fake.close(() => resolve())));

afterEach(() => {
  routes = {};
  requests = [];
});

async function connect(overrides: Partial<Config> = {}): Promise<Client> {
  const config: Config = {
    apiUrl: `${baseUrl}/api/v1`,
    apiKey: "test-key",
    webhookBaseUrl: baseUrl,
    readOnly: false,
    timeoutMs: 5_000,
    maxResponseChars: 80_000,
    ...overrides,
  };
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await createServer(config).connect(serverTransport);
  const client = new Client({ name: "test", version: "1.0.0" });
  await client.connect(clientTransport);
  return client;
}

async function callTool(client: Client, name: string, args: Record<string, unknown> = {}) {
  const result = await client.callTool({ name, arguments: args });
  const text = (result.content as Array<{ text: string }>)[0]?.text ?? "";
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = undefined;
  }
  return { isError: result.isError === true, text, json: json as Record<string, unknown> };
}

const storedWorkflow = {
  id: "wf1",
  name: "Leads",
  description: "old",
  active: true,
  isArchived: false,
  versionId: "v1",
  tags: [{ id: "t1", name: "crm" }],
  pinData: { Hook: [{ json: {} }] },
  shared: [{ role: "workflow:owner" }],
  staticData: null,
  settings: { executionOrder: "v1" },
  nodes: [
    { id: "n1", name: "Hook", type: "n8n-nodes-base.webhook", typeVersion: 2, position: [0, 0], parameters: { path: "lead" } },
    { id: "n2", name: "Set", type: "n8n-nodes-base.set", typeVersion: 3, position: [200, 0], parameters: { a: 1 } },
  ],
  connections: { Hook: { main: [[{ node: "Set", type: "main", index: 0 }]] } },
};

describe("n8n MCP server", () => {
  it("registers every tool, and only read tools in read-only mode", async () => {
    const all = (await (await connect()).listTools()).tools;
    const readOnly = (await (await connect({ readOnly: true })).listTools()).tools;

    expect(all.length).toBeGreaterThan(30);
    expect(readOnly.length).toBeLessThan(all.length);
    expect(readOnly.every((tool) => tool.annotations?.readOnlyHint === true)).toBe(true);
    expect(readOnly.map((tool) => tool.name)).toContain("n8n_list_workflows");
    expect(readOnly.map((tool) => tool.name)).not.toContain("n8n_delete_workflow");
    expect(all.find((tool) => tool.name === "n8n_delete_workflow")?.annotations?.destructiveHint).toBe(true);
  });

  it("sends the API key and summarizes listed workflows", async () => {
    routes["GET /api/v1/workflows"] = () => ({ body: { data: [storedWorkflow], nextCursor: "next" } });
    const { json } = await callTool(await connect(), "n8n_list_workflows", { active: true, limit: 10 });

    expect(requests[0]?.headers["x-n8n-api-key"]).toBe("test-key");
    expect(requests[0]?.query).toEqual({ active: "true", limit: "10", excludePinnedData: "true" });
    expect(json.nextCursor).toBe("next");
    expect(json.workflows).toEqual([
      expect.objectContaining({ id: "wf1", tags: ["crm"], nodeCount: 2, webhooks: [expect.objectContaining({ path: "lead" })] }),
    ]);
    expect(JSON.stringify(json)).not.toContain('"parameters"');
  });

  it("updates only the given fields and never sends read-only ones", async () => {
    routes["GET /api/v1/workflows/wf1"] = () => ({ body: storedWorkflow });
    routes["PUT /api/v1/workflows/wf1"] = ({ body }) => ({ body: { ...storedWorkflow, ...(body as object) } });
    const client = await connect();

    const { isError, json } = await callTool(client, "n8n_update_workflow", { id: "wf1", name: "Renamed" });
    expect(isError).toBe(false);
    expect(json.name).toBe("Renamed");
    const put = requests.find((request) => request.method === "PUT");
    expect(put?.body).toEqual({
      name: "Renamed",
      nodes: storedWorkflow.nodes,
      connections: storedWorkflow.connections,
      settings: storedWorkflow.settings,
    });
    expect(put?.query).toEqual({});

    requests = [];
    await callTool(client, "n8n_update_workflow", { id: "wf1", description: "new", publishIfActive: false });
    const secondPut = requests.find((request) => request.method === "PUT");
    expect(secondPut?.query).toEqual({ publishIfActive: "false" });
    expect(secondPut?.body).toMatchObject({ name: "Leads", description: "new" });
  });

  it("retries with known settings when n8n rejects the stored ones", async () => {
    routes["GET /api/v1/workflows/wf1"] = () => ({
      body: { ...storedWorkflow, settings: { executionOrder: "v1", somethingNew: true } },
    });
    routes["PUT /api/v1/workflows/wf1"] = ({ body }) =>
      (body as { settings: object }).settings.hasOwnProperty("somethingNew")
        ? { status: 400, body: { message: "request/body/settings must NOT have additional properties" } }
        : { body: storedWorkflow };

    const { isError } = await callTool(await connect(), "n8n_update_workflow", { id: "wf1", name: "x" });
    expect(isError).toBe(false);
    const puts = requests.filter((request) => request.method === "PUT");
    expect(puts).toHaveLength(2);
    expect((puts[1]?.body as { settings: object }).settings).toEqual({ executionOrder: "v1" });
  });

  it("applies targeted edits in a single save", async () => {
    routes["GET /api/v1/workflows/wf1"] = () => ({ body: storedWorkflow });
    routes["PUT /api/v1/workflows/wf1"] = ({ body }) => ({ body: { ...storedWorkflow, ...(body as object) } });

    const { isError, json } = await callTool(await connect(), "n8n_edit_workflow", {
      id: "wf1",
      operations: [
        { op: "updateNode", name: "Set", changes: { parameters: { b: 2 } } },
        { op: "addNode", node: { name: "Done", type: "n8n-nodes-base.noOp" } },
        { op: "addConnection", from: "Set", to: "Done" },
      ],
    });
    expect(isError).toBe(false);
    expect(json.appliedOperations).toBe(3);
    const body = requests.find((request) => request.method === "PUT")?.body as typeof storedWorkflow;
    expect(body.nodes.map((node) => node.name)).toEqual(["Hook", "Set", "Done"]);
    expect(body.nodes[1]?.parameters).toEqual({ a: 1, b: 2 });
    expect(body.connections).toHaveProperty("Set.main.0.0.node", "Done");
  });

  it("does not save anything when an edit fails", async () => {
    routes["GET /api/v1/workflows/wf1"] = () => ({ body: storedWorkflow });
    const { isError, text } = await callTool(await connect(), "n8n_edit_workflow", {
      id: "wf1",
      operations: [{ op: "removeNode", name: "Nope" }],
    });
    expect(isError).toBe(true);
    expect(text).toContain('Node "Nope" not found');
    expect(requests.some((request) => request.method === "PUT")).toBe(false);
  });

  it("publishes with the n8n 2.x route and falls back to the 1.x one", async () => {
    routes["POST /api/v1/workflows/wf1/publish"] = () => ({ body: { ...storedWorkflow, active: true } });
    const client = await connect();
    expect((await callTool(client, "n8n_activate_workflow", { id: "wf1" })).json.active).toBe(true);

    routes = { "POST /api/v1/workflows/wf1/activate": () => ({ body: { ...storedWorkflow, active: true } }) };
    requests = [];
    const { isError } = await callTool(client, "n8n_activate_workflow", { id: "wf1" });
    expect(isError).toBe(false);
    expect(requests.map((request) => request.path)).toEqual([
      "/api/v1/workflows/wf1/publish",
      "/api/v1/workflows/wf1/activate",
    ]);
  });

  it("calls production and test webhooks without the API key", async () => {
    routes["POST /webhook/lead"] = () => ({ body: { ok: true } });
    routes["POST /webhook-test/lead"] = () => ({ body: { ok: "test" } });
    const client = await connect();

    const production = await callTool(client, "n8n_trigger_webhook", { path: "/lead", body: { name: "Ana" } });
    expect(production.json).toMatchObject({ status: 200, body: { ok: true } });
    expect(requests[0]?.body).toEqual({ name: "Ana" });
    expect(requests[0]?.headers["x-n8n-api-key"]).toBeUndefined();

    const test = await callTool(client, "n8n_trigger_webhook", { path: "lead", test: true });
    expect(test.json).toMatchObject({ body: { ok: "test" } });
  });

  it("turns API errors into readable tool errors", async () => {
    routes["GET /api/v1/workflows"] = () => ({ status: 401, body: { message: "unauthorized" } });
    const { isError, text } = await callTool(await connect(), "n8n_health_check");
    expect(isError).toBe(true);
    expect(text).toMatch(/N8N_API_KEY/);
    expect(text).toContain("unauthorized");
  });

  it("reports when n8n cannot be reached", async () => {
    const client = await connect({ apiUrl: "http://127.0.0.1:1/api/v1" });
    const { isError, text } = await callTool(client, "n8n_list_tags");
    expect(isError).toBe(true);
    expect(text).toContain("Could not reach n8n");
  });

  it("sends data table filters as JSON", async () => {
    routes["GET /api/v1/data-tables/dt1/rows"] = () => ({ body: { data: [{ id: 1 }], nextCursor: null } });
    const filter = { type: "and", filters: [{ columnName: "status", condition: "eq", value: "new" }] };
    const { json } = await callTool(await connect(), "n8n_get_data_table_rows", { dataTableId: "dt1", filter });
    expect(json.rows).toEqual([{ id: 1 }]);
    expect(JSON.parse(requests[0]?.query.filter ?? "")).toEqual(filter);
  });
});

describe("formatResult", () => {
  it("truncates long responses with a hint", () => {
    const full = JSON.stringify({ data: "x".repeat(500) }, null, 2);
    const text = formatResult({ data: "x".repeat(500) }, 100);
    expect(text.startsWith(full.slice(0, 100))).toBe(true);
    expect(text).not.toContain(full.slice(0, 101));
    expect(text).toContain(`the response was ${full.length} characters`);
    expect(formatResult("short", 100)).toBe("short");
  });
});
