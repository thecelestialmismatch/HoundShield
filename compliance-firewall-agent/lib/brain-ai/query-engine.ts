/**
 * Brain AI — QueryEnginePort
 *
 * Multi-turn conversation engine with token budget enforcement and turn limits.
 * adapted for TypeScript/Next.js streaming.
 *
 * Manages session lifecycle, persists sessions, and orchestrates the
 * Kaelus ReAct loop through a clean QueryEngine interface.
 */

import {
  QueryEngineConfig,
  defaultQueryEngineConfig,
  StoredSession,
  StoredMessage,
  UsageSummary,
  TurnResult,
  createUsageSummary,
  addTurn,
} from "./models";
import {
  createSession,
  loadSession,
  saveSession,
  appendMessage,
  addTokenUsage,
} from "./session-store";

export interface SubmitOptions {
  sessionId: string;
  userMessage: string;
  config?: Partial<QueryEngineConfig>;
  onEvent?: (event: QueryEngineEvent) => void;
  apiKey?: string;
}

export type QueryEngineEvent =
  | { type: "thinking"; content: string }
  | { type: "token"; content: string }
  | { type: "tool_call"; toolName: string; args: unknown }
  | { type: "tool_result"; toolName: string; result: unknown }
  | { type: "turn_complete"; turn: number; maxTurns: number; usage: UsageSummary }
  | { type: "done"; turnResult: TurnResult }
  | { type: "error"; message: string }
  | { type: "budget_exceeded"; tokensUsed: number; maxTokens: number }
  | { type: "max_turns_reached"; turnsUsed: number };

export class QueryEnginePort {
  private config: QueryEngineConfig;

  constructor(config?: Partial<QueryEngineConfig>) {
    this.config = { ...defaultQueryEngineConfig(), ...config };
  }

  /**
   * Submit a message and stream events. Sessions are persisted automatically.
   * Port of QueryEnginePort.stream_submit_message() from Brain AI.
   */
  async *streamSubmitMessage(options: SubmitOptions): AsyncGenerator<QueryEngineEvent> {
    const cfg = { ...this.config, ...options.config };
    const { sessionId, userMessage, onEvent, apiKey } = options;

    // Load or create session
    let session = await loadSession(sessionId);
    if (!session) {
      session = createSession(sessionId, cfg.systemPrompt);
    }

    // Check token budget before starting
    const currentTokens = session.inputTokens + session.outputTokens;
    if (currentTokens >= cfg.maxBudgetTokens) {
      const event: QueryEngineEvent = {
        type: "budget_exceeded",
        tokensUsed: currentTokens,
        maxTokens: cfg.maxBudgetTokens,
      };
      if (onEvent) onEvent(event);
      yield event;
      return;
    }

    // Count turns from message history (user messages only)
    const turnCount = session.messages.filter((m) => m.role === "user").length;
    if (turnCount >= cfg.maxTurns) {
      const event: QueryEngineEvent = {
        type: "max_turns_reached",
        turnsUsed: turnCount,
      };
      if (onEvent) onEvent(event);
      yield event;
      return;
    }

    // Append user message to session
    session = appendMessage(session, { role: "user", content: userMessage });
    await saveSession(session);

    // Build messages for the LLM call
    const messages = session.messages;

    // Execute agent loop with streaming
    const usage = createUsageSummary();
    let outputContent = "";
    const matchedTools: TurnResult["matchedTools"] = [];

    try {
      // Dynamic import to avoid circular deps
      const { executeAgentLoop } = await import("../agent/orchestrator");
      const { AgentStreamEvent } = await import("../agent/types");

      const openRouterMessages = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      await executeAgentLoop(openRouterMessages, {
        model: cfg.model,
        systemPrompt: messages.find((m) => m.role === "system")?.content ?? cfg.systemPrompt,
        maxIterations: Math.min(cfg.maxTurns - turnCount, 15),
        temperature: cfg.temperature,
        apiKey: apiKey ?? process.env.OPENROUTER_API_KEY ?? "",
        sessionId,
        onEvent: (agentEvent: typeof AgentStreamEvent) => {
          // Map agent events to QueryEngine events
          const evt = agentEvent as { type: string; content?: string; toolName?: string; args?: unknown; result?: unknown; usage?: { inputTokens: number; outputTokens: number } };

          if (evt.type === "thinking" && evt.content) {
            const qEvent: QueryEngineEvent = { type: "thinking", content: evt.content };
            if (onEvent) onEvent(qEvent);
          } else if (evt.type === "content" && evt.content) {
            outputContent += evt.content;
            const qEvent: QueryEngineEvent = { type: "token", content: evt.content };
            if (onEvent) onEvent(qEvent);
          } else if (evt.type === "tool_call" && evt.toolName) {
            const qEvent: QueryEngineEvent = {
              type: "tool_call",
              toolName: evt.toolName,
              args: evt.args ?? {},
            };
            if (onEvent) onEvent(qEvent);
          } else if (evt.type === "tool_result" && evt.toolName) {
            matchedTools.push({
              name: evt.toolName,
              category: "unknown",
              prompt: userMessage,
              handled: true,
              result: evt.result,
            });
            const qEvent: QueryEngineEvent = {
              type: "tool_result",
              toolName: evt.toolName,
              result: evt.result,
            };
            if (onEvent) onEvent(qEvent);
          } else if (evt.type === "usage" && evt.usage) {
            Object.assign(usage, addTurn(usage, evt.usage.inputTokens, evt.usage.outputTokens));
          }
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const event: QueryEngineEvent = { type: "error", message };
      if (onEvent) onEvent(event);
      yield event;
      return;
    }

    // Persist assistant reply to session
    if (outputContent) {
      session = appendMessage(session, { role: "assistant", content: outputContent });
      session = addTokenUsage(session, usage.inputTokens, usage.outputTokens);
      await saveSession(session);
    }

    const turnResult: TurnResult = {
      prompt: userMessage,
      output: outputContent,
      matchedCommands: [],
      matchedTools,
      permissionDenials: [],
      usage,
      stopReason: "end_turn",
    };

    const doneEvent: QueryEngineEvent = { type: "done", turnResult };
    if (onEvent) onEvent(doneEvent);
    yield doneEvent;
  }

  /**
   * Non-streaming version — collects all events and returns final TurnResult.
   * Port of QueryEnginePort.submit_message() from Brain AI.
   */
  async submitMessage(options: SubmitOptions): Promise<TurnResult> {
    let finalResult: TurnResult | null = null;
    for await (const event of this.streamSubmitMessage(options)) {
      if (event.type === "done") {
        finalResult = event.turnResult;
      }
    }
    if (!finalResult) {
      return {
        prompt: options.userMessage,
        output: "",
        matchedCommands: [],
        matchedTools: [],
        permissionDenials: [],
        usage: createUsageSummary(),
        stopReason: "error",
      };
    }
    return finalResult;
  }

  /** Load persisted session for inspection */
  async getSession(sessionId: string): Promise<StoredSession | null> {
    return loadSession(sessionId);
  }

  /** Create a fresh session (e.g. new conversation) */
  async newSession(sessionId: string): Promise<StoredSession> {
    const session = createSession(sessionId, this.config.systemPrompt);
    await saveSession(session);
    return session;
  }

  updateConfig(config: Partial<QueryEngineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): QueryEngineConfig {
    return { ...this.config };
  }
}
