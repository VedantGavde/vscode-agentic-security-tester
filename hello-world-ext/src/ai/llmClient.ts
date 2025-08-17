// src/ai/llmClient.ts

export interface LLMResponse {
  output: string;
}

interface OllamaResponse {
  response?: string;
  error?: string;
}

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";

/** Ensure localhost bypasses corporate proxies (common source of 404s from proxy). */
function ensureNoProxyLocalhost() {
  const cur = process.env.NO_PROXY || process.env.no_proxy || "";
  const needed = ["127.0.0.1", "localhost"];
  const list = cur
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let changed = false;
  for (const n of needed) {
    if (!list.includes(n)) {
      list.push(n);
      changed = true;
    }
  }
  if (changed) process.env.NO_PROXY = list.join(",");
}

/**
 * Sends a prompt to the local Ollama server and returns its response.
 */
export async function queryLLM(model: string, prompt: string): Promise<LLMResponse> {
  ensureNoProxyLocalhost();

  // Abort after 30s
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);

  let res: any;
  try {
    res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false }),
      signal: controller.signal,
    } as any);
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();

  if (!res.ok) {
    // Surface real server body to help diagnose (e.g., proxy 404 vs model not found).
    throw new Error(`LLM request failed: ${res.status} ${res.statusText} – ${text}`);
  }

  try {
    const data = JSON.parse(text) as OllamaResponse;
    if (typeof data.response !== "string") {
      throw new Error(`Unexpected Ollama payload: ${text}`);
    }
    return { output: data.response };
  } catch (e) {
    throw new Error(`Failed to decode Ollama JSON: ${String(e)} – raw: ${text}`);
  }
}

