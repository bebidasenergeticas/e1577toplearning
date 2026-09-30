import type { Config } from "./config.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";

export type QueryValue = string | number | boolean | undefined | null;
export type Query = Record<string, QueryValue>;

export interface RequestOptions {
  query?: Query;
  body?: unknown;
}

/** A page of results as returned by the list endpoints of the n8n API. */
export interface Page<T> {
  data: T[];
  nextCursor?: string | null;
}

export class N8nApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "N8nApiError";
  }
}

export interface WebhookRequest {
  path: string;
  method: HttpMethod;
  test: boolean;
  query?: Query;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface WebhookResponse {
  url: string;
  status: number;
  contentType: string | null;
  body: unknown;
}

function buildUrl(base: string, path: string, query?: Query): string {
  const url = new URL(`${base}/${path.replace(/^\/+/, "")}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text === "") return null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("json")) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return text;
}

function describeFailure(status: number, body: unknown): string {
  const serverMessage =
    body && typeof body === "object" && "message" in body && typeof body.message === "string"
      ? body.message
      : typeof body === "string" && body.length > 0 && body.length < 500
        ? body
        : undefined;

  const hint: Record<number, string> = {
    401: "Unauthorized: check that N8N_API_KEY is valid and has not expired.",
    403: "Forbidden: the API key lacks the scope or the license feature required for this action.",
    404: "Not found.",
  };
  const prefix = hint[status] ?? `n8n API request failed with HTTP ${status}.`;
  return serverMessage ? `${prefix} n8n says: ${serverMessage}` : prefix;
}

export class N8nClient {
  constructor(private readonly config: Pick<Config, "apiUrl" | "apiKey" | "webhookBaseUrl" | "timeoutMs">) {}

  async request<T = unknown>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<T> {
    const url = buildUrl(this.config.apiUrl, path, options.query);
    const headers: Record<string, string> = {
      "X-N8N-API-KEY": this.config.apiKey,
      Accept: "application/json",
    };
    let body: string | undefined;
    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body,
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (error) {
      throw new N8nApiError(`Could not reach n8n at ${this.config.apiUrl}: ${errorMessage(error)}`, 0);
    }

    const parsed = await parseBody(response);
    if (!response.ok) {
      throw new N8nApiError(describeFailure(response.status, parsed), response.status, parsed);
    }
    return parsed as T;
  }

  get<T = unknown>(path: string, query?: Query): Promise<T> {
    return this.request<T>("GET", path, { query });
  }

  post<T = unknown>(path: string, body?: unknown, query?: Query): Promise<T> {
    return this.request<T>("POST", path, { body, query });
  }

  put<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, { body });
  }

  patch<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, { body });
  }

  delete<T = unknown>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }

  /**
   * Calls a workflow's Webhook trigger. Unlike the REST API, webhooks are not
   * authenticated with the API key, so it is not sent.
   */
  async callWebhook(request: WebhookRequest): Promise<WebhookResponse> {
    const prefix = request.test ? "webhook-test" : "webhook";
    const url = buildUrl(this.config.webhookBaseUrl, `${prefix}/${request.path.replace(/^\/+/, "")}`, request.query);
    const headers: Record<string, string> = { ...request.headers };
    let body: string | undefined;
    if (request.body !== undefined && request.method !== "GET" && request.method !== "HEAD") {
      body = typeof request.body === "string" ? request.body : JSON.stringify(request.body);
      if (!Object.keys(headers).some((name) => name.toLowerCase() === "content-type")) {
        headers["Content-Type"] = typeof request.body === "string" ? "text/plain" : "application/json";
      }
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: request.method,
        headers,
        body,
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (error) {
      throw new N8nApiError(`Could not reach webhook ${url}: ${errorMessage(error)}`, 0);
    }

    return {
      url,
      status: response.status,
      contentType: response.headers.get("content-type"),
      body: await parseBody(response),
    };
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    const cause = error.cause instanceof Error ? ` (${error.cause.message})` : "";
    return `${error.message}${cause}`;
  }
  return String(error);
}
