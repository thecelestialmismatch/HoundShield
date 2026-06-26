import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { resolveLlmProvider, isLlmConfigured } from "../provider";

const ENV_KEYS = [
  "OPENROUTER_API_KEY",
  "NVIDIA_API_KEY",
  "NVIDIA_NIM_API_KEY",
  "BRAIN_AI_NVIDIA_MODEL",
];

describe("resolveLlmProvider", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
    for (const k of ENV_KEYS) delete process.env[k];
  });
  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("prefers an explicit OpenRouter key argument", () => {
    process.env.NVIDIA_API_KEY = "nv-123";
    const p = resolveLlmProvider("or-explicit");
    expect(p.name).toBe("openrouter");
    expect(p.apiKey).toBe("or-explicit");
    expect(p.url).toContain("openrouter.ai");
    expect(p.modelOverride).toBeUndefined();
  });

  it("uses OPENROUTER_API_KEY when no arg is given", () => {
    process.env.OPENROUTER_API_KEY = "or-env";
    const p = resolveLlmProvider();
    expect(p.name).toBe("openrouter");
    expect(p.apiKey).toBe("or-env");
    expect(p.headers?.["X-Title"]).toBe("HoundShield Agent");
  });

  it("falls back to NVIDIA NIM when only an NVIDIA key is set", () => {
    process.env.NVIDIA_API_KEY = "nv-456";
    const p = resolveLlmProvider();
    expect(p.name).toBe("nvidia");
    expect(p.apiKey).toBe("nv-456");
    expect(p.url).toContain("integrate.api.nvidia.com");
    expect(p.modelOverride).toBe("meta/llama-3.3-70b-instruct");
  });

  it("accepts NVIDIA_NIM_API_KEY as an alias", () => {
    process.env.NVIDIA_NIM_API_KEY = "nim-789";
    expect(resolveLlmProvider().apiKey).toBe("nim-789");
  });

  it("honors BRAIN_AI_NVIDIA_MODEL override", () => {
    process.env.NVIDIA_API_KEY = "nv-456";
    process.env.BRAIN_AI_NVIDIA_MODEL = "meta/llama-3.1-8b-instruct";
    expect(resolveLlmProvider().modelOverride).toBe("meta/llama-3.1-8b-instruct");
  });

  it("treats a blank/whitespace OpenRouter key as unset (falls back)", () => {
    process.env.OPENROUTER_API_KEY = "   ";
    process.env.NVIDIA_API_KEY = "nv-456";
    expect(resolveLlmProvider("  ").name).toBe("nvidia");
  });

  it("returns the OpenRouter shape with empty key when nothing is configured", () => {
    const p = resolveLlmProvider();
    expect(p.name).toBe("openrouter");
    expect(p.apiKey).toBe("");
    expect(isLlmConfigured()).toBe(false);
  });

  it("isLlmConfigured is true for either provider", () => {
    process.env.OPENROUTER_API_KEY = "or";
    expect(isLlmConfigured()).toBe(true);
    delete process.env.OPENROUTER_API_KEY;
    process.env.NVIDIA_API_KEY = "nv";
    expect(isLlmConfigured()).toBe(true);
  });
});
