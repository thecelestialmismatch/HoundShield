/**
 * Brain AI — Public API
 *
 * The central intelligence layer for Kaelus.online.
 * Connects the query engine, session store, runtime, commands, and tools
 * into a single cohesive "Brain" for the compliance firewall.
 *
 * Brain AI — original implementation.
 * Created for Kaelus.online. All rights reserved.
 * 
 * 
 * 
 * 
 */

export * from "./models";
export * from "./session-store";
export * from "./commands";
export * from "./tools";
export * from "./system-init";
export * from "./manifest";
export * from "./cost-tracker";
export * from "./permissions";
export * from "./history";
export * from "./execution-registry";
export * from "./skills";
export * from "./context";
export * from "./tasks";
export * from "./tool-pool";
export * from "./deferred-init";
export * from "./bootstrap-graph";
export * from "./command-graph";
export * from "./tool-definitions";
export * from "./dialog-launchers";
export * from "./setup";
export * from "./runtime-modes";
export * from "./onboarding-state";
export * from "./prefetch";
export * from "./hooks";
export * from "./state";
export * from "./utils";
export type { QueryEngineEvent, SubmitOptions } from "./query-engine";
export { QueryEnginePort } from "./query-engine";
export { PortRuntime } from "./runtime";
export { generateTranscript, formatTranscript } from "./transcript";
export { runParityAudit } from "./parity-audit";
export { QueryEngineRuntime } from "./query";

import { QueryEnginePort } from "./query-engine";
import { PortRuntime } from "./runtime";
import { buildSystemInitMessage } from "./system-init";

// ─── Singletons ────────────────────────────────────────────────────────────

let _queryEngine: QueryEnginePort | null = null;
let _runtime: PortRuntime | null = null;

/**
 * Get the singleton QueryEnginePort instance.
 * Lazily initialized on first access.
 */
export function getQueryEngine(): QueryEnginePort {
  if (!_queryEngine) {
    _queryEngine = new QueryEnginePort({
      model: process.env.BRAIN_AI_MODEL ?? "google/gemini-flash-1.5",
      maxTurns: 15,
      maxBudgetTokens: 8192,
    });
  }
  return _queryEngine;
}

/**
 * Get the singleton PortRuntime instance.
 * Lazily initialized on first access.
 */
export function getRuntime(): PortRuntime {
  if (!_runtime) {
    _runtime = new PortRuntime({
      model: process.env.BRAIN_AI_MODEL ?? "google/gemini-flash-1.5",
      apiKey: process.env.OPENROUTER_API_KEY ?? "",
      maxTurns: 15,
      maxBudgetTokens: 8192,
      allowCodeExecution: false,
    });
  }
  return _runtime;
}

/**
 * BrainAI — the unified interface for the entire intelligence layer.
 *
 * Usage:
 *   import { BrainAI } from '@/lib/brain-ai';
 *   const stream = BrainAI.chat({ sessionId: 'abc', message: 'What is CMMC?' });
 *   for await (const event of stream) { ... }
 */
export const BrainAI = {
  /**
   * Stream a conversation turn through Brain AI.
   * Sessions are persisted automatically.
   */
  chat(options: {
    sessionId: string;
    message: string;
    apiKey?: string;
    model?: string;
  }) {
    const runtime = getRuntime();
    return runtime.runTurnLoop(options.sessionId, options.message);
  },

  /**
   * Route a prompt and return scored matches (no LLM call).
   */
  route(prompt: string) {
    return getRuntime().routePrompt(prompt);
  },

  /**
   * Bootstrap a new session with optional context.
   */
  bootstrap(sessionId: string, context?: string) {
    return getRuntime().bootstrapSession(sessionId, context);
  },

  /**
   * Get the system initialization status.
   */
  systemInit() {
    return buildSystemInitMessage();
  },

  /**
   * Access the query engine directly for advanced use cases.
   */
  queryEngine: getQueryEngine,

  /**
   * Access the runtime directly.
   */
  runtime: getRuntime,
};

export default BrainAI;
