import { describe, expect, it } from "vitest";
import { loadConfig, normalizeApiUrl } from "../src/config.js";

describe("normalizeApiUrl", () => {
  it.each([
    ["https://n8n.example.com", "https://n8n.example.com/api/v1"],
    ["https://n8n.example.com/", "https://n8n.example.com/api/v1"],
    ["https://n8n.example.com/api/v1", "https://n8n.example.com/api/v1"],
    ["https://n8n.example.com/api/v1/", "https://n8n.example.com/api/v1"],
    ["https://example.com/n8n", "https://example.com/n8n/api/v1"],
    ["http://localhost:5678", "http://localhost:5678/api/v1"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizeApiUrl(input)).toBe(expected);
  });

  it("rejects invalid URLs and other protocols", () => {
    expect(() => normalizeApiUrl("n8n.example.com")).toThrow(/not a valid URL/);
    expect(() => normalizeApiUrl("ftp://n8n.example.com")).toThrow(/http or https/);
  });
});

describe("loadConfig", () => {
  it("requires the URL and the API key", () => {
    expect(() => loadConfig({})).toThrow(/N8N_API_URL/);
    expect(() => loadConfig({ N8N_API_URL: "https://n8n.example.com" })).toThrow(/N8N_API_KEY/);
  });

  it("applies defaults and derives the webhook URL from the API URL", () => {
    const config = loadConfig({ N8N_API_URL: "https://n8n.example.com/sub/api/v1", N8N_API_KEY: "key" });
    expect(config).toEqual({
      apiUrl: "https://n8n.example.com/sub/api/v1",
      apiKey: "key",
      webhookBaseUrl: "https://n8n.example.com/sub",
      readOnly: false,
      timeoutMs: 30_000,
      maxResponseChars: 80_000,
    });
  });

  it("reads the optional settings", () => {
    const config = loadConfig({
      N8N_API_URL: "https://n8n.example.com",
      N8N_API_KEY: "key",
      N8N_WEBHOOK_URL: "https://hooks.example.com/",
      N8N_MCP_READ_ONLY: "TRUE",
      N8N_TIMEOUT_MS: "5000",
    });
    expect(config.webhookBaseUrl).toBe("https://hooks.example.com");
    expect(config.readOnly).toBe(true);
    expect(config.timeoutMs).toBe(5000);
    expect(() => loadConfig({ N8N_API_URL: "https://x.io", N8N_API_KEY: "k", N8N_TIMEOUT_MS: "-1" })).toThrow();
  });
});
