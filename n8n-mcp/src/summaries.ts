/**
 * Compact views of n8n objects. Full workflows and execution data can be
 * hundreds of kilobytes, which would crowd out everything else in the model's
 * context, so list tools return these summaries instead.
 */

type Json = Record<string, unknown>;

interface WorkflowNode {
  name?: string;
  type?: string;
  disabled?: boolean;
  parameters?: Json;
}

const LEGACY_TRIGGER_TYPES = new Set([
  "n8n-nodes-base.webhook",
  "n8n-nodes-base.cron",
  "n8n-nodes-base.interval",
  "n8n-nodes-base.start",
]);

const WEBHOOK_TYPES = new Set(["n8n-nodes-base.webhook", "n8n-nodes-base.formTrigger", "@n8n/n8n-nodes-langchain.chatTrigger"]);

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTriggerType(type: string): boolean {
  return /trigger$/i.test(type) || LEGACY_TRIGGER_TYPES.has(type);
}

function nodesOf(workflow: Json): WorkflowNode[] {
  return Array.isArray(workflow.nodes) ? (workflow.nodes as WorkflowNode[]) : [];
}

/** Webhook endpoints exposed by a workflow, as needed by the trigger-webhook tool. */
export function webhookEndpoints(workflow: Json): Json[] {
  return nodesOf(workflow)
    .filter((node) => node.type && WEBHOOK_TYPES.has(node.type) && !node.disabled)
    .map((node) => {
      const parameters = node.parameters ?? {};
      return {
        node: node.name,
        type: node.type,
        method: node.type === "n8n-nodes-base.webhook" ? (parameters.httpMethod ?? "GET") : undefined,
        path: parameters.path ?? (node as Json).webhookId,
      };
    });
}

export function summarizeWorkflow(workflow: Json): Json {
  const nodes = nodesOf(workflow);
  const tags = Array.isArray(workflow.tags) ? (workflow.tags as Json[]).map((tag) => tag.name) : undefined;
  const webhooks = webhookEndpoints(workflow);
  return {
    id: workflow.id,
    name: workflow.name,
    active: workflow.active,
    isArchived: workflow.isArchived,
    tags,
    nodeCount: nodes.length,
    triggers: nodes.filter((node) => node.type && isTriggerType(node.type)).map((node) => node.type),
    webhooks: webhooks.length > 0 ? webhooks : undefined,
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt,
  };
}

function truncateJson(value: unknown, maxChars: number): unknown {
  const text = JSON.stringify(value);
  if (text === undefined || text.length <= maxChars) return value;
  return `${text.slice(0, maxChars)}… [truncated]`;
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function describeError(error: unknown): Json | undefined {
  if (!isObject(error)) return undefined;
  const node = isObject(error.node) ? error.node.name : undefined;
  return {
    message: error.message,
    description: error.description ?? undefined,
    node,
  };
}

function durationMs(start: unknown, stop: unknown): number | undefined {
  if (typeof start !== "string" || typeof stop !== "string") return undefined;
  const ms = Date.parse(stop) - Date.parse(start);
  return Number.isFinite(ms) ? ms : undefined;
}

export function summarizeExecution(execution: Json, sampleChars = 1_000): Json {
  const summary: Json = {
    id: execution.id,
    workflowId: execution.workflowId,
    status: execution.status,
    mode: execution.mode,
    finished: execution.finished,
    startedAt: execution.startedAt,
    stoppedAt: execution.stoppedAt,
    durationMs: durationMs(execution.startedAt, execution.stoppedAt),
    retryOf: execution.retryOf ?? undefined,
    retrySuccessId: execution.retrySuccessId ?? undefined,
    waitTill: execution.waitTill ?? undefined,
  };

  const data = parseMaybeJson(execution.data);
  if (!isObject(data) || !isObject(data.resultData)) return summary;

  const resultData = data.resultData;
  summary.error = describeError(resultData.error);
  summary.lastNodeExecuted = resultData.lastNodeExecuted;

  const runData = isObject(resultData.runData) ? resultData.runData : {};
  summary.nodes = Object.entries(runData).map(([name, runs]) => {
    const taskRuns = Array.isArray(runs) ? (runs as Json[]) : [];
    let items = 0;
    let sample: unknown;
    let executionTimeMs = 0;
    let error: Json | undefined;
    let status: unknown;
    for (const run of taskRuns) {
      executionTimeMs += typeof run.executionTime === "number" ? run.executionTime : 0;
      status = run.executionStatus ?? status;
      error = describeError(run.error) ?? error;
      const outputs = isObject(run.data) && Array.isArray(run.data.main) ? (run.data.main as unknown[]) : [];
      for (const output of outputs) {
        if (!Array.isArray(output)) continue;
        items += output.length;
        if (sample === undefined && output.length > 0 && isObject(output[0])) {
          sample = truncateJson(output[0].json, sampleChars);
        }
      }
    }
    return { node: name, runs: taskRuns.length, status, items, executionTimeMs, error, firstItem: sample };
  });

  return summary;
}
