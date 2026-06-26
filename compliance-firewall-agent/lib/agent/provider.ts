// ---------------------------------------------------------------------------
// LLM provider resolution for Brain AI.
//
// Brain AI talks to an OpenAI-compatible /chat/completions endpoint. We prefer
// OpenRouter (800+ model catalog) and fall back to NVIDIA NIM
// (https://integrate.api.nvidia.com/v1) — also OpenAI-compatible — so the
// feature works even if only an NVIDIA key is provisioned. Both are commercial
// cloud endpoints (NOT FedRAMP-authorized): Brain AI must keep its
// "do not input CUI" warning regardless of which one is active.
// ---------------------------------------------------------------------------

export type LlmProviderName = "openrouter" | "nvidia";

export interface LlmProvider {
  name: LlmProviderName;
  url: string;
  apiKey: string;
  /** Overrides the requested model slug — providers use different catalogs. */
  modelOverride?: string;
  /** Provider-specific request headers, merged over the defaults. */
  headers?: Record<string, string>;
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const NVIDIA_DEFAULT_MODEL = "meta/llama-3.3-70b-instruct";

const OPENROUTER_HEADERS = {
  "HTTP-Referer": "https://houndshield.com",
  "X-Title": "HoundShield Agent",
} as const;

function clean(value?: string | null): string {
  return (value ?? "").trim();
}

function openRouter(apiKey: string): LlmProvider {
  return { name: "openrouter", url: OPENROUTER_URL, apiKey, headers: { ...OPENROUTER_HEADERS } };
}

/**
 * Resolve which provider Brain AI should call.
 *
 * Order: explicit OpenRouter key arg → OPENROUTER_API_KEY → NVIDIA_API_KEY /
 * NVIDIA_NIM_API_KEY. When nothing is configured we still return the OpenRouter
 * shape (empty key) so existing "missing key" handling — the keyless FAQ
 * fallback and upstream 401 path — behaves exactly as before.
 */
export function resolveLlmProvider(openRouterKey?: string): LlmProvider {
  const orKey = clean(openRouterKey) || clean(process.env.OPENROUTER_API_KEY);
  if (orKey) return openRouter(orKey);

  const nvKey = clean(process.env.NVIDIA_API_KEY) || clean(process.env.NVIDIA_NIM_API_KEY);
  if (nvKey) {
    return {
      name: "nvidia",
      url: NVIDIA_URL,
      apiKey: nvKey,
      modelOverride: clean(process.env.BRAIN_AI_NVIDIA_MODEL) || NVIDIA_DEFAULT_MODEL,
    };
  }

  return openRouter("");
}

/** True when some LLM provider has a usable key (OpenRouter or NVIDIA). */
export function isLlmConfigured(openRouterKey?: string): boolean {
  return resolveLlmProvider(openRouterKey).apiKey.length > 0;
}
