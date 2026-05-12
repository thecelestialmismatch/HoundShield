/**
 * Brain AI — Runtime Modes
 *
 * Direct connection, deep-link, and remote execution modes.
 * Describes how Brain AI can be invoked from different contexts.
 * Brain AI original implementation for Hound Shield.
 */

export type RuntimeMode =
  | "standard"      // Normal SSE streaming via /api/brain-ai/execute
  | "direct"        // Direct API call, no streaming
  | "deep_link"     // Launched via URL deep-link (e.g. houndshield.com/chat?q=...)
  | "remote"        // Proxied through external gateway
  | "ssh"           // SSH tunnel mode (Docker only)
  | "embedded";     // Embedded in another app via SDK

export interface DirectModeReport {
  mode: RuntimeMode;
  endpoint: string;
  supportsStreaming: boolean;
  supportsTools: boolean;
  maxTokens: number;
  latencyClass: "realtime" | "fast" | "standard";
  notes: string;
}

export interface RuntimeModeReport {
  activeMode: RuntimeMode;
  available: DirectModeReport[];
  recommended: RuntimeMode;
}

const RUNTIME_MODES: DirectModeReport[] = [
  {
    mode: "standard",
    endpoint: "/api/brain-ai/execute",
    supportsStreaming: true,
    supportsTools: true,
    maxTokens: 8192,
    latencyClass: "realtime",
    notes: "Default mode. SSE streaming. Works on Vercel and Docker.",
  },
  {
    mode: "direct",
    endpoint: "/api/brain-ai/execute",
    supportsStreaming: false,
    supportsTools: true,
    maxTokens: 8192,
    latencyClass: "fast",
    notes: "Non-streaming. Good for programmatic use via Brain AI SDK.",
  },
  {
    mode: "deep_link",
    endpoint: "/chat",
    supportsStreaming: true,
    supportsTools: false,
    maxTokens: 4096,
    latencyClass: "fast",
    notes: "Launched via URL: /chat?q=<prompt>. Pre-fills chat input.",
  },
  {
    mode: "remote",
    endpoint: "/api/gateway/stream",
    supportsStreaming: true,
    supportsTools: false,
    maxTokens: 16384,
    latencyClass: "standard",
    notes: "Routes through Hound Shield compliance gateway with full scanning.",
  },
  {
    mode: "embedded",
    endpoint: "https://gateway.houndshield.com/v1",
    supportsStreaming: true,
    supportsTools: false,
    maxTokens: 16384,
    latencyClass: "standard",
    notes: "SDK mode — drop-in replacement for OpenAI/Anthropic API base URL.",
  },
];

export function getActiveMode(): RuntimeMode {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    if (params.has("q")) return "deep_link";
  }
  if (process.env.BRAIN_AI_MODE) return process.env.BRAIN_AI_MODE as RuntimeMode;
  return "standard";
}

export function getRuntimeModeReport(): RuntimeModeReport {
  const activeMode = getActiveMode();
  return {
    activeMode,
    available: RUNTIME_MODES,
    recommended: "standard",
  };
}

export function getModeConfig(mode: RuntimeMode): DirectModeReport | undefined {
  return RUNTIME_MODES.find((m) => m.mode === mode);
}

export function runDirectConnect(prompt: string, sessionId: string): {
  url: string;
  method: string;
  body: string;
} {
  return {
    url: "/api/brain-ai/execute",
    method: "POST",
    body: JSON.stringify({ sessionId, message: prompt }),
  };
}

export function runDeepLink(prompt: string, baseUrl = ""): string {
  return `${baseUrl}/chat?q=${encodeURIComponent(prompt)}`;
}

export function renderRuntimeModes(): string {
  const lines = ["## Brain AI Runtime Modes\n"];
  for (const m of RUNTIME_MODES) {
    const stream = m.supportsStreaming ? "streaming" : "sync";
    const tools = m.supportsTools ? "tools ✅" : "no tools";
    lines.push(`### ${m.mode}`);
    lines.push(`- **Endpoint:** \`${m.endpoint}\``);
    lines.push(`- **Mode:** ${stream} · ${tools} · max ${m.maxTokens} tokens`);
    lines.push(`- **Latency:** ${m.latencyClass}`);
    lines.push(`- ${m.notes}`);
    lines.push("");
  }
  return lines.join("\n");
}
