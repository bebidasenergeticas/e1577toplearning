export interface Config {
  /** Base URL of the n8n public REST API, e.g. https://n8n.example.com/api/v1 */
  apiUrl: string;
  /** API key created in n8n under Settings → n8n API. */
  apiKey: string;
  /** Base URL used to call workflow webhooks, e.g. https://n8n.example.com */
  webhookBaseUrl: string;
  /** When true, only tools that do not modify n8n are registered. */
  readOnly: boolean;
  /** Timeout for each HTTP request made to n8n, in milliseconds. */
  timeoutMs: number;
  /** Tool responses longer than this are truncated so they fit in the model's context. */
  maxResponseChars: number;
}

const API_PATH = /\/api\/v\d+$/;

function parseBoolean(value: string | undefined): boolean {
  return value !== undefined && ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function parsePositiveInt(name: string, value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer, got "${value}"`);
  }
  return parsed;
}

function stripTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Accepts either the instance URL (https://n8n.example.com) or the API URL
 * (https://n8n.example.com/api/v1) and returns the API URL.
 */
export function normalizeApiUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error(`N8N_API_URL is not a valid URL: "${raw}"`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`N8N_API_URL must use http or https, got "${url.protocol}"`);
  }
  const base = stripTrailingSlashes(`${url.origin}${url.pathname}`);
  return API_PATH.test(base) ? base : `${base}/api/v1`;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const rawUrl = env.N8N_API_URL ?? env.N8N_URL;
  if (!rawUrl) {
    throw new Error("Missing N8N_API_URL (e.g. https://n8n.example.com/api/v1)");
  }
  const apiKey = env.N8N_API_KEY;
  if (!apiKey) {
    throw new Error("Missing N8N_API_KEY (create one in n8n under Settings → n8n API)");
  }

  const apiUrl = normalizeApiUrl(rawUrl);
  const webhookBaseUrl = stripTrailingSlashes(env.N8N_WEBHOOK_URL ?? apiUrl.replace(API_PATH, ""));

  return {
    apiUrl,
    apiKey,
    webhookBaseUrl,
    readOnly: parseBoolean(env.N8N_MCP_READ_ONLY),
    timeoutMs: parsePositiveInt("N8N_TIMEOUT_MS", env.N8N_TIMEOUT_MS, 30_000),
    maxResponseChars: parsePositiveInt("N8N_MCP_MAX_RESPONSE_CHARS", env.N8N_MCP_MAX_RESPONSE_CHARS, 80_000),
  };
}
