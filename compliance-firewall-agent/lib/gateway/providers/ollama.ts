/**
 * Ollama Local Model Provider — Kaelus.Online Air-Gap Mode
 *
 * Routes AI requests to a local Ollama instance instead of cloud providers.
 * Enables full air-gap compliance: no data ever leaves the network.
 *
 * Required env vars:
 *   OLLAMA_BASE_URL     — e.g. http://localhost:11434 (default)
 *
 * Optional env vars:
 *   OLLAMA_DEFAULT_MODEL — default model to use, e.g. "llama3.2" or "phi4"
 *   OLLAMA_TIMEOUT_MS    — request timeout, defaults to 120000 (2 min)
 *
 * Setup:
 *   1. Install Ollama: https://ollama.com
 *   2. Pull a model: ollama pull llama3.2
 *   3. Set OLLAMA_BASE_URL=http://your-server:11434
 *   4. All AI requests route through Kaelus compliance scanning first
 *
 * Recommended models for CMMC/defense use cases:
 *   - llama3.2      — best general purpose (3B, fast)
 *   - phi4          — best reasoning (14B, Microsoft)
 *   - mistral       — strong code + analysis (7B)
 *   - llama3.1:70b  — highest quality (70B, requires >40GB VRAM)
 */

export interface OllamaStreamChunk {
  model: string;
  created_at: string;
  message?: { role: string; content: string };
  done: boolean;
  done_reason?: string;
}

export interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaRequestOptions {
  model?: string;
  messages: OllamaMessage[];
  temperature?: number;
  stream?: boolean;
  /** Max tokens to generate (maps to Ollama num_predict) */
  maxTokens?: number;
}

export interface OllamaResponse {
  /** Streaming body for SSE proxy, or null if Ollama is unavailable */
  body: ReadableStream | null;
  /** HTTP status */
  status: number;
  /** Error message if status != 200 */
  error?: string;
}

const DEFAULT_BASE_URL = "http://localhost:11434";
const DEFAULT_TIMEOUT_MS = 120_000;

function getBaseUrl(): string {
  return (process.env.OLLAMA_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
}

function getDefaultModel(): string {
  return process.env.OLLAMA_DEFAULT_MODEL ?? "llama3.2";
}

/**
 * Check if an Ollama instance is reachable.
 * Used by health endpoints and gateway routing logic.
 */
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(`${getBaseUrl()}/api/tags`, {
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * List models available in the local Ollama instance.
 */
export async function listOllamaModels(): Promise<string[]> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/tags`);
    if (!res.ok) return [];
    const data = (await res.json()) as { models?: Array<{ name: string }> };
    return (data.models ?? []).map((m) => m.name);
  } catch {
    return [];
  }
}

/**
 * Send a chat request to Ollama and return the streaming response.
 * The returned body is in Ollama's NDJSON streaming format.
 * Use `proxyOllamaStream` to convert it to Kaelus SSE format.
 */
export async function streamOllamaChat(
  opts: OllamaRequestOptions
): Promise<OllamaResponse> {
  const url = `${getBaseUrl()}/api/chat`;
  const model = opts.model ?? getDefaultModel();

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: opts.messages,
        stream: opts.stream ?? true,
        options: {
          temperature: opts.temperature ?? 0.7,
          num_predict: opts.maxTokens ?? 1024,
        },
      }),
      signal: ctrl.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { body: null, status: res.status, error: text.slice(0, 200) };
    }

    return { body: res.body, status: 200 };
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    return { body: null, status: 503, error: `Ollama unavailable: ${msg}` };
  }
}

/**
 * Convert an Ollama NDJSON stream to Kaelus SSE format.
 * Output: `data: {"content": "..."}\n\n` chunks, then `data: [DONE]\n\n`
 */
export function proxyOllamaStream(body: ReadableStream): ReadableStream {
  const encoder = new TextEncoder();
  let contentEmitted = false;

  return new ReadableStream({
    async start(controller) {
      const reader = body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const chunk = JSON.parse(trimmed) as OllamaStreamChunk;
              const content = chunk.message?.content;
              if (content) {
                contentEmitted = true;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                );
              }
              if (chunk.done) {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              }
            } catch {
              // Skip malformed NDJSON lines
            }
          }
        }
      } catch (err) {
        console.error("[ollama] Stream read error:", err);
      }

      if (!contentEmitted) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ content: "Ollama model did not generate a response. Check that the model is pulled and running." })}\n\n`
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      }

      controller.close();
    },
  });
}
