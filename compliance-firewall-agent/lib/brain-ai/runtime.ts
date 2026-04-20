/**
 * Brain AI — PortRuntime
 *
 * scoring-based prompt routing,
 * session bootstrap, and multi-turn loop orchestration.
 *
 * The scoring algorithm tokenizes the user's prompt and matches it
 * against available commands and tools, ranking by relevance.
 */

import {
  RoutedMatch,
  RuntimeSession,
  TurnResult,
  createUsageSummary,
  PermissionDenial,
} from "./models";
import { loadCommandSnapshot, scoreCommandMatch, CommandSnapshot } from "./commands";
import { loadToolSnapshot, scoreToolMatch, ToolSnapshot } from "./tools";
import { QueryEnginePort, QueryEngineEvent } from "./query-engine";
import { createSession, saveSession, loadSession } from "./session-store";

// Tools/commands that require explicit permission
const RESTRICTED_TOOLS = new Set(["code-execute"]);
const RESTRICTED_COMMANDS = new Set<string>();

export interface RuntimeConfig {
  maxTurns?: number;
  maxBudgetTokens?: number;
  model?: string;
  apiKey?: string;
  allowCodeExecution?: boolean;
  onEvent?: (event: QueryEngineEvent) => void;
}

export class PortRuntime {
  private queryEngine: QueryEnginePort;
  private config: Required<RuntimeConfig>;

  constructor(config: RuntimeConfig = {}) {
    this.config = {
      maxTurns: config.maxTurns ?? 15,
      maxBudgetTokens: config.maxBudgetTokens ?? 8192,
      model: config.model ?? "google/gemini-flash-1.5",
      apiKey: config.apiKey ?? process.env.OPENROUTER_API_KEY ?? "",
      allowCodeExecution: config.allowCodeExecution ?? false,
      onEvent: config.onEvent ?? (() => {}),
    };
    this.queryEngine = new QueryEnginePort({
      maxTurns: this.config.maxTurns,
      maxBudgetTokens: this.config.maxBudgetTokens,
      model: this.config.model,
    });
  }

  /**
   * Route a user prompt — score it against commands and tools,
   * infer permission denials, and return ordered matches.
   * Port of PortRuntime.route_prompt() + _score() from Brain AI.
   */
  routePrompt(prompt: string): {
    matches: RoutedMatch[];
    denials: PermissionDenial[];
  } {
    const commands = loadCommandSnapshot();
    const tools = loadToolSnapshot();
    const matches: RoutedMatch[] = [];

    // Score commands
    for (const cmd of commands) {
      const score = scoreCommandMatch(cmd, prompt);
      if (score > 0) {
        matches.push({
          type: "command",
          name: cmd.name,
          score,
          sourceHint: cmd.sourceHint,
        });
      }
    }

    // Score tools
    for (const tool of tools) {
      const score = scoreToolMatch(tool, prompt);
      if (score > 0) {
        matches.push({
          type: "tool",
          name: tool.name,
          score,
          sourceHint: tool.sourceHint,
        });
      }
    }

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    // Infer permission denials
    const denials = this._inferPermissionDenials(matches);

    // Filter out denied items from top matches
    const allowedMatches = matches.filter(
      (m) => !denials.some((d) => d.toolName === m.name)
    );

    return { matches: allowedMatches.slice(0, 5), denials };
  }

  /** Port of PortRuntime._infer_permission_denials() from Brain AI */
  private _inferPermissionDenials(matches: RoutedMatch[]): PermissionDenial[] {
    const denials: PermissionDenial[] = [];
    for (const match of matches) {
      if (match.type === "tool" && RESTRICTED_TOOLS.has(match.name)) {
        if (!this.config.allowCodeExecution) {
          denials.push({
            toolName: match.name,
            reason: "Code execution requires explicit user permission. Enable in settings.",
          });
        }
      }
      if (match.type === "command" && RESTRICTED_COMMANDS.has(match.name)) {
        denials.push({
          toolName: match.name,
          reason: "This command requires elevated permissions.",
        });
      }
    }
    return denials;
  }

  /**
   * Bootstrap a new session with context about the user's environment.
   * Port of PortRuntime.bootstrap_session() from Brain AI.
   */
  async bootstrapSession(sessionId: string, context?: string): Promise<RuntimeSession> {
    const existing = await loadSession(sessionId);
    const storedSession = existing ?? createSession(sessionId);
    await saveSession(storedSession);

    return {
      sessionId,
      prompt: "",
      setup: context ?? "Hound Shield Brain AI — CMMC Compliance Firewall",
      history: [],
      totalUsage: createUsageSummary(),
      createdAt: storedSession.createdAt,
      updatedAt: storedSession.updatedAt,
    };
  }

  /**
   * Run the multi-turn loop for a given prompt.
   * Port of PortRuntime.run_turn_loop() from Brain AI.
   */
  async *runTurnLoop(
    sessionId: string,
    prompt: string
  ): AsyncGenerator<QueryEngineEvent> {
    const { matches, denials } = this.routePrompt(prompt);

    // Emit routing info as a thinking event
    if (matches.length > 0) {
      const topMatch = matches[0];
      const thinkingEvent: QueryEngineEvent = {
        type: "thinking",
        content: `Routing to: ${topMatch.type}/${topMatch.name} (score: ${topMatch.score})`,
      };
      yield thinkingEvent;
      this.config.onEvent(thinkingEvent);
    }

    // Emit denial warnings
    for (const denial of denials) {
      const thinkingEvent: QueryEngineEvent = {
        type: "thinking",
        content: `Permission denied for ${denial.toolName}: ${denial.reason}`,
      };
      yield thinkingEvent;
    }

    // Submit to query engine
    for await (const event of this.queryEngine.streamSubmitMessage({
      sessionId,
      userMessage: prompt,
      config: {
        model: this.config.model,
      },
      apiKey: this.config.apiKey,
      onEvent: this.config.onEvent,
    })) {
      yield event;
    }
  }

  /**
   * Format a completed RuntimeSession as markdown.
   * Port of PortRuntime.as_markdown() from Brain AI.
   */
  asMarkdown(session: RuntimeSession): string {
    const lines = [
      `# Brain AI Session — ${session.sessionId}`,
      `**Started:** ${new Date(session.createdAt).toISOString()}`,
      `**Turns:** ${session.history.length}`,
      `**Tokens:** ${session.totalUsage.totalTokens}`,
      "",
      `## Setup`,
      session.setup,
      "",
      "## Conversation",
    ];

    for (const turn of session.history) {
      lines.push(`\n### User\n${turn.prompt}`);
      lines.push(`\n### Brain AI\n${turn.output}`);
      if (turn.matchedTools.length > 0) {
        lines.push(
          `\n**Tools used:** ${turn.matchedTools.map((t) => t.name).join(", ")}`
        );
      }
    }

    return lines.join("\n");
  }

  getQueryEngine(): QueryEnginePort {
    return this.queryEngine;
  }
}
