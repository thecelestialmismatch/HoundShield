import type { InterceptedRequest } from "@/lib/supabase/types";
import { randomUUID } from "crypto";

// Known LLM provider API hostnames
const LLM_PROVIDER_PATTERNS: Record<string, RegExp> = {
  openai: /api\.openai\.com/i,
  anthropic: /api\.anthropic\.com/i,
  google: /generativelanguage\.googleapis\.com/i,
  cohere: /api\.cohere\.ai/i,
  mistral: /api\.mistral\.ai/i,
  huggingface: /api-inference\.huggingface\.co/i,
};

/**
 * Detects which LLM provider a request targets based on the URL.
 * Returns null if the URL doesn't match any known provider.
 */
export function detectProvider(url: string): string | null {
  for (const [provider, pattern] of Object.entries(LLM_PROVIDER_PATTERNS)) {
    if (pattern.test(url)) return provider;
  }
  return null;
}

/**
 * Extracts the prompt content from various LLM API request formats.
 * Handles OpenAI chat completions, Anthropic messages, and generic formats.
 */
export function extractPromptFromBody(
  body: Record<string, unknown>,
  provider: string | null
): string {
  // OpenAI chat completions format
  if (body.messages && Array.isArray(body.messages)) {
    return (body.messages as Array<{ role: string; content: string }>)
      .map((m) => `[${m.role}]: ${typeof m.content === "string" ? m.content : JSON.stringify(m.content)}`)
      .join("\n");
  }

  // OpenAI legacy completions format
  if (typeof body.prompt === "string") {
    return body.prompt;
  }

  // Anthropic format with system + messages
  const parts: string[] = [];
  if (typeof body.system === "string") {
    parts.push(`[system]: ${body.system}`);
  }
  if (body.messages && Array.isArray(body.messages)) {
    for (const msg of body.messages as Array<{ role: string; content: unknown }>) {
      const content =
        typeof msg.content === "string"
          ? msg.content
          : JSON.stringify(msg.content);
      parts.push(`[${msg.role}]: ${content}`);
    }
  }
  if (parts.length > 0) return parts.join("\n");

  // Fallback: stringify the entire body
  return JSON.stringify(body);
}

/**
 * Parses an incoming HTTP request into an InterceptedRequest.
 * This is the entry point for the interception pipeline.
 */
export function parseInterceptRequest(
  body: Record<string, unknown>,
  headers: Record<string, string>,
  userId: string
): InterceptedRequest {
  const destinationUrl =
    (body._destination_url as string) ??
    (headers["x-destination-url"] as string) ??
    "unknown";

  const provider = detectProvider(destinationUrl);
  const prompt = extractPromptFromBody(body, provider);

  return {
    prompt,
    user_id: userId,
    destination: provider ?? destinationUrl,
    timestamp: new Date().toISOString(),
    request_id: randomUUID(),
    headers,
  };
}
