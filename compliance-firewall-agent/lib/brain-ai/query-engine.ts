/**
 * Brain AI — QueryEnginePort
 *
 * Multi-turn conversation engine with token budget enforcement and turn limits.
 *
 * Evolution highlights:
 *
 *   • Real-time streaming — `streamSubmitMessage` now yields every intermediate
 *     event (thinking, token, tool_call, tool_result) as they arrive, not just
 *     the final `done` event. An AsyncQueue bridges the callback-based
 *     executeAgentLoop into the async-generator interface.
 *
 *   • Error isolation — if the agent loop throws, the error is yielded as a
 *     `{ type: "error" }` event and the generator completes cleanly rather than
 *     propagating an unhandled rejection.
 *
 *   • Session persistence unchanged — Supabase save still happens after the
 *     loop finishes so partial writes on disconnects are avoided.
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

// ---------------------------------------------------------------------------
// AsyncQueue — bridges callback-based emitters into async generators
//
// Pattern: producer calls push() from synchronous callbacks; consumer calls
// the async iterator to pull items one at a time. close() signals end-of-stream.
// ---------------------------------------------------------------------------

class AsyncQueue<T> {
  private items: T[] = [];
  private waiters: Array<(value: IteratorResult<T>) => void> = [];
  private closed = false;

  /** Push an item into the queue. Resolves a waiting consumer if one exists. */
  push(item: T): void {
    if (this.waiters.length > 0) {
      // Direct hand-off: avoid queuing if a consumer is already waiting
      this.waiters.shift()!({ value: item, done: false });
    } else {
      this.items.push(item);
    }
  }

  /** Signal that no more items will be pushed. */
  close(): void {
    this.closed = true;
    while (this.waiters.length > 0) {
      this.waiters.shift()!({ value: undefined as unknown as T, done: true });
    }
  }

  async next(): Promise<IteratorResult<T>> {
    if (this.items.length > 0) {
      return { value: this.items.shift()!, done: false };
    }
    if (this.closed) {
      return { value: undefined as unknown as T, done: true };
    }
    return new Promise<IteratorResult<T>>((resolve) => {
      this.waiters.push(resolve);
    });
  }

  async *[Symbol.asyncIterator](): AsyncIterableIterator<T> {
    while (true) {
      const result = await this.next();
      if (result.done) return;
      yield result.value;
    }
  }
}

// ---------------------------------------------------------------------------
// QueryEnginePort
// ---------------------------------------------------------------------------

export class QueryEnginePort {
  private config: QueryEngineConfig;

  constructor(config?: Partial<QueryEngineConfig>) {
    this.config = { ...defaultQueryEngineConfig(), ...config };
  }

  /**
   * Submit a message and stream events in real-time.
   *
   * Every intermediate event from the agent loop (thinking tokens, tool calls,
   * tool results) is yielded immediately as the loop produces it — not batched
   * until the turn is complete. This enables responsive streaming UIs.
   *
   * Sessions are persisted to Supabase after the loop finishes.
   */
  async *streamSubmitMessage(options: SubmitOptions): AsyncGenerator<QueryEngineEvent> {
    const cfg = { ...this.config, ...options.config };
    const { sessionId, userMessage, onEvent, apiKey } = options;

    // ── Load or create session ──────────────────────────────────────────────
    let session = await loadSession(sessionId);
    if (!session) {
      session = createSession(sessionId, cfg.systemPrompt);
    }

    // ── Guard: token budget ─────────────────────────────────────────────────
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

    // ── Guard: turn limit ───────────────────────────────────────────────────
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

    // ── Append user message and save ────────────────────────────────────────
    session = appendMessage(session, { role: "user", content: userMessage });
    await saveSession(session);

    // ── Build messages for the LLM call ─────────────────────────────────────
    const messages = session.messages;
    const usage = createUsageSummary();
    let outputContent = "";
    const matchedTools: TurnResult["matchedTools"] = [];

    // ── Async queue: bridges executeAgentLoop callbacks → async generator ───
    const queue = new AsyncQueue<QueryEngineEvent>();

    const { executeAgentLoop } = await import("../agent/orchestrator");
    const { AgentStreamEvent } = await import("../agent/types");

    const openRouterMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    // Start the agent loop in the background; it pushes events into the queue
    const loopPromise = executeAgentLoop(openRouterMessages, {
      model: cfg.model,
      systemPrompt: messages.find((m) => m.role === "system")?.content ?? cfg.systemPrompt,
      maxIterations: Math.min(cfg.maxTurns - turnCount, 15),
      temperature: cfg.temperature,
      apiKey: apiKey ?? process.env.OPENROUTER_API_KEY ?? "",
      sessionId,
      onEvent: (agentEvent: typeof AgentStreamEvent) => {
        const evt = agentEvent as {
          type: string;
          content?: string;
          tool?: string;
          args?: unknown;
          result?: string;
          usage?: { inputTokens?: number; outputTokens?: number; prompt?: number; completion?: number };
        };

        let qEvent: QueryEngineEvent | null = null;

        if (evt.type === "thinking" && evt.content) {
          qEvent = { type: "thinking", content: evt.content };
        } else if (evt.type === "content" && evt.content) {
          outputContent += evt.content;
          qEvent = { type: "token", content: evt.content };
        } else if (evt.type === "tool_call" && evt.tool) {
          qEvent = { type: "tool_call", toolName: evt.tool, args: evt.args ?? {} };
        } else if (evt.type === "tool_result" && evt.tool) {
          matchedTools.push({
            name: evt.tool,
            category: "unknown",
            prompt: userMessage,
            handled: true,
            result: evt.result,
          });
          qEvent = { type: "tool_result", toolName: evt.tool, result: evt.result };
        } else if (evt.type === "usage" && evt.usage) {
          const inp = evt.usage.inputTokens ?? evt.usage.prompt ?? 0;
          const out = evt.usage.outputTokens ?? evt.usage.completion ?? 0;
          Object.assign(usage, addTurn(usage, inp, out));
          // usage events are internal bookkeeping — not forwarded to consumer
          return;
        } else if (evt.type === "error" && (evt as { message?: string }).message) {
          qEvent = { type: "error", message: (evt as { message: string }).message };
        }

        if (qEvent) {
          if (onEvent) onEvent(qEvent);
          queue.push(qEvent);
        }
      },
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      const errEvent: QueryEngineEvent = { type: "error", message };
      if (onEvent) onEvent(errEvent);
      queue.push(errEvent);
    }).finally(() => {
      queue.close();
    });

    // ── Yield events as they arrive ─────────────────────────────────────────
    for await (const event of queue) {
      yield event;
      // Stop consuming if we hit a terminal event
      if (event.type === "error") {
        await loopPromise;
        return;
      }
    }

    await loopPromise;

    // ── Persist assistant reply ─────────────────────────────────────────────
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
   * Non-streaming version — collects all events and returns the final TurnResult.
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

  /** Load persisted session for inspection. */
  async getSession(sessionId: string): Promise<StoredSession | null> {
    return loadSession(sessionId);
  }

  /** Create a fresh session (e.g. new conversation). */
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
