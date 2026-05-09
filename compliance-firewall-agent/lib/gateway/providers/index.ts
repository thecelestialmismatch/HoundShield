/**
 * Hound Shield Streaming Gateway — Provider Registry
 *
 * Central registry that maps provider names to their adapters and configurations.
 * This module is the single entry point for the streaming proxy to resolve
 * which adapter to use for a given request.
 *
 * Responsibilities:
 * 1. Adapter lookup — returns the correct `ProviderAdapter` for a `ProviderName`.
 * 2. Config lookup — static configuration (API base URLs, supported models, etc).
 * 3. URL detection — identifies which provider a URL belongs to.
 * 4. API key validation — basic format checks before sending requests.
 *
 * Design decision: We use a static registry (not a plugin system) because the
 * provider set is small and well-known. Adding a new provider requires adding
 * an adapter file and registering it here. This keeps the code simple and
 * fully type-safe without a dynamic loading mechanism.
 */

import type {
  ProviderAdapter,
  ProviderConfig,
  ProviderName,
} from "./types";
import { openaiAdapter, OPENAI_MODELS } from "./openai";
import { anthropicAdapter, ANTHROPIC_MODELS } from "./anthropic";
import { googleAdapter, GOOGLE_MODELS } from "./google";
import { openrouterAdapter, OPENROUTER_MODELS } from "./openrouter";

// ---------------------------------------------------------------------------
// Provider configurations
// ---------------------------------------------------------------------------

/**
 * Static configuration for every supported provider.
 *
 * These configs describe the provider's API surface — base URL, default model,
 * auth header name, and supported models. They're used for validation and
 * documentation, not for making requests (that's the adapter's job).
 */
export const PROVIDER_CONFIGS: Record<ProviderName, ProviderConfig> = {
  openai: {
    name: "openai",
    apiBase: "https://api.openai.com",
    defaultModel: "gpt-4o",
    models: [...OPENAI_MODELS],
    streamPath: "/v1/chat/completions",
    authHeader: "Authorization",
    maxTimeoutMs: 120_000,
  },
  anthropic: {
    name: "anthropic",
    apiBase: "https://api.anthropic.com",
    defaultModel: "claude-sonnet-4-20250514",
    models: [...ANTHROPIC_MODELS],
    streamPath: "/v1/messages",
    authHeader: "x-api-key",
    maxTimeoutMs: 120_000,
  },
  google: {
    name: "google",
    apiBase: "https://generativelanguage.googleapis.com",
    defaultModel: "gemini-2.0-flash",
    models: [...GOOGLE_MODELS],
    streamPath: "/v1beta/models",
    authHeader: "key", // Passed as URL param, not header
    maxTimeoutMs: 120_000,
  },
  openrouter: {
    name: "openrouter",
    apiBase: "https://openrouter.ai",
    defaultModel: "openai/gpt-4o",
    models: [...OPENROUTER_MODELS],
    streamPath: "/api/v1/chat/completions",
    authHeader: "Authorization",
    maxTimeoutMs: 120_000,
  },
  cohere: {
    name: "cohere",
    apiBase: "https://api.cohere.ai",
    defaultModel: "command-r-plus",
    models: ["command-r-plus", "command-r", "command-light"],
    streamPath: "/v1/chat",
    authHeader: "Authorization",
    maxTimeoutMs: 120_000,
  },
  mistral: {
    name: "mistral",
    apiBase: "https://api.mistral.ai",
    defaultModel: "mistral-large-latest",
    models: [
      "mistral-large-latest",
      "mistral-medium-latest",
      "mistral-small-latest",
      "open-mixtral-8x22b",
      "open-mistral-7b",
    ],
    streamPath: "/v1/chat/completions",
    authHeader: "Authorization",
    maxTimeoutMs: 120_000,
  },
  custom: {
    name: "custom",
    apiBase: "",
    defaultModel: "",
    models: [],
    streamPath: "/v1/chat/completions",
    authHeader: "Authorization",
    maxTimeoutMs: 120_000,
  },
};

// ---------------------------------------------------------------------------
// Adapter registry
// ---------------------------------------------------------------------------

/**
 * Internal adapter map.
 *
 * Cohere and Mistral use the OpenAI-compatible format, so they reuse
 * the OpenAI adapter. The "custom" provider also uses OpenAI format
 * (this is the de facto standard for self-hosted models like vLLM, Ollama).
 */
const ADAPTER_REGISTRY: Record<ProviderName, ProviderAdapter> = {
  openai: openaiAdapter,
  anthropic: anthropicAdapter,
  google: googleAdapter,
  // OpenRouter — unified access to 200+ models through one API key.
  openrouter: openrouterAdapter,
  // Cohere and Mistral support OpenAI-compatible endpoints.
  // Their SSE format is identical to OpenAI's, so we reuse the adapter.
  cohere: { ...openaiAdapter, name: "cohere" },
  mistral: { ...openaiAdapter, name: "mistral" },
  // Custom providers are assumed to speak the OpenAI protocol.
  custom: { ...openaiAdapter, name: "custom" },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the streaming adapter for a given provider.
 *
 * @throws Error if the provider name is not recognized. This should never
 *         happen in practice because `ProviderName` is a union type, but
 *         we check at runtime for safety against invalid user input.
 */
export function getProvider(name: ProviderName): ProviderAdapter {
  const adapter = ADAPTER_REGISTRY[name];
  if (!adapter) {
    throw new Error(
      `[houndshield:registry] Unknown provider: "${name}". ` +
      `Supported providers: ${Object.keys(ADAPTER_REGISTRY).join(", ")}`
    );
  }
  return adapter;
}

/**
 * Returns the static configuration for a given provider.
 *
 * @throws Error if the provider name is not recognized.
 */
export function getProviderConfig(name: ProviderName): ProviderConfig {
  const config = PROVIDER_CONFIGS[name];
  if (!config) {
    throw new Error(
      `[houndshield:registry] Unknown provider config: "${name}". ` +
      `Supported providers: ${Object.keys(PROVIDER_CONFIGS).join(", ")}`
    );
  }
  return config;
}

// ---------------------------------------------------------------------------
// URL-based provider detection
// ---------------------------------------------------------------------------

/**
 * Hostname patterns for known LLM providers.
 *
 * This mirrors the patterns in `lib/interceptor/request-parser.ts` but
 * returns a typed `ProviderName` instead of a plain string. We maintain
 * a separate copy here because the gateway module should not depend on
 * the interceptor module (they may be deployed independently).
 */
const PROVIDER_URL_PATTERNS: Array<{
  provider: ProviderName;
  pattern: RegExp;
}> = [
  { provider: "openai", pattern: /api\.openai\.com/i },
  { provider: "anthropic", pattern: /api\.anthropic\.com/i },
  { provider: "google", pattern: /generativelanguage\.googleapis\.com/i },
  { provider: "cohere", pattern: /api\.cohere\.ai/i },
  { provider: "mistral", pattern: /api\.mistral\.ai/i },
  { provider: "openrouter", pattern: /openrouter\.ai/i },
];

/**
 * Detects which LLM provider a URL belongs to.
 *
 * Used by the gateway intercept route to auto-detect the provider when
 * the client doesn't explicitly specify one.
 *
 * @param url - The destination URL to check.
 * @returns The detected provider name, or `null` if no match.
 */
export function detectProviderFromUrl(url: string): ProviderName | null {
  for (const { provider, pattern } of PROVIDER_URL_PATTERNS) {
    if (pattern.test(url)) return provider;
  }
  return null;
}

// ---------------------------------------------------------------------------
// API key validation
// ---------------------------------------------------------------------------

/**
 * API key format patterns for each provider.
 *
 * These are basic prefix/format checks to catch obvious mistakes
 * (wrong key, pasted the wrong env var, etc) before hitting the
 * provider's API. They are NOT security validations — the provider
 * performs the real auth check.
 *
 * Returns a human-readable error message if the format looks wrong,
 * or `null` if the key looks plausible.
 */
const KEY_VALIDATORS: Record<ProviderName, (key: string) => string | null> = {
  openai: (key) => {
    // OpenAI keys start with "sk-" and are typically 51+ characters.
    // Project keys start with "sk-proj-".
    if (!key.startsWith("sk-")) {
      return 'OpenAI API keys should start with "sk-". Check your API key.';
    }
    if (key.length < 30) {
      return "OpenAI API key appears too short. Check your API key.";
    }
    return null;
  },

  anthropic: (key) => {
    // Anthropic keys start with "sk-ant-"
    if (!key.startsWith("sk-ant-")) {
      return 'Anthropic API keys should start with "sk-ant-". Check your API key.';
    }
    if (key.length < 40) {
      return "Anthropic API key appears too short. Check your API key.";
    }
    return null;
  },

  google: (key) => {
    // Google AI API keys are typically 39 characters, alphanumeric with dashes
    if (key.length < 20) {
      return "Google API key appears too short. Check your API key.";
    }
    return null;
  },

  cohere: (key) => {
    if (key.length < 20) {
      return "Cohere API key appears too short. Check your API key.";
    }
    return null;
  },

  mistral: (key) => {
    if (key.length < 20) {
      return "Mistral API key appears too short. Check your API key.";
    }
    return null;
  },

  openrouter: (key) => {
    // OpenRouter keys start with "sk-or-"
    if (!key.startsWith("sk-or-")) {
      return 'OpenRouter API keys should start with "sk-or-". Check your API key.';
    }
    if (key.length < 30) {
      return "OpenRouter API key appears too short. Check your API key.";
    }
    return null;
  },

  custom: () => {
    // No format validation for custom providers — anything goes
    return null;
  },
};

/**
 * Validates the format of a provider API key.
 *
 * This is a fast, client-side sanity check. It does NOT verify the key
 * is actually valid (that requires hitting the provider's API).
 *
 * @returns An error message string if the key format looks wrong,
 *          or `null` if the key passes basic validation.
 */
export function validateApiKeyFormat(
  provider: ProviderName,
  apiKey: string
): string | null {
  if (!apiKey || apiKey.trim() === "") {
    return `API key is required for provider "${provider}".`;
  }

  const validator = KEY_VALIDATORS[provider];
  if (!validator) return null;

  return validator(apiKey.trim());
}

/**
 * Validates that a model is supported by the given provider.
 *
 * @returns `true` if the model is in the provider's supported list,
 *          or if the provider is "custom" (which accepts any model).
 */
export function isModelSupported(
  provider: ProviderName,
  model: string
): boolean {
  if (provider === "custom") return true;

  const config = PROVIDER_CONFIGS[provider];
  return config.models.includes(model);
}

/**
 * Returns the full list of supported providers with their configs.
 * Used by the docs page and API discovery endpoints.
 */
export function listProviders(): Array<{
  name: ProviderName;
  config: ProviderConfig;
  models: string[];
}> {
  return Object.entries(PROVIDER_CONFIGS)
    .filter(([name]) => name !== "custom")
    .map(([name, config]) => ({
      name: name as ProviderName,
      config,
      models: config.models,
    }));
}
