/**
 * Brain AI — Query Types & Runtime
 *
 * QueryRequest/QueryResponse types and the QueryEngineRuntime
 * that routes prompts to the best-matching handler.
 * Brain AI original implementation for Hound Shield.
 */

import { RoutedMatch } from "./models";
import { loadCommandSnapshot, scoreCommandMatch } from "./commands";
import { loadToolSnapshot, scoreToolMatch } from "./tools";

// ─── Request / Response ────────────────────────────────────────────────────

export interface QueryRequest {
  prompt: string;
  sessionId: string;
  model?: string;
  maxTokens?: number;
  stream?: boolean;
  metadata?: Record<string, unknown>;
}

export interface QueryResponse {
  sessionId: string;
  output: string;
  matches: RoutedMatch[];
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  error?: string;
}

// ─── QueryEngineRuntime ────────────────────────────────────────────────────

/**
 * Routes a prompt to the best-matching command or tool.
 * Scores all candidates and returns ordered matches.
 */
export class QueryEngineRuntime {
  route(prompt: string): RoutedMatch[] {
    const matches: RoutedMatch[] = [];

    for (const cmd of loadCommandSnapshot()) {
      const score = scoreCommandMatch(cmd, prompt);
      if (score > 0) {
        matches.push({ type: "command", name: cmd.name, score, sourceHint: cmd.sourceHint });
      }
    }

    for (const tool of loadToolSnapshot()) {
      const score = scoreToolMatch(tool, prompt);
      if (score > 0) {
        matches.push({ type: "tool", name: tool.name, score, sourceHint: tool.sourceHint });
      }
    }

    return matches.sort((a, b) => b.score - a.score);
  }

  topMatch(prompt: string): RoutedMatch | null {
    return this.route(prompt)[0] ?? null;
  }

  topN(prompt: string, n: number): RoutedMatch[] {
    return this.route(prompt).slice(0, n);
  }

  renderMatches(prompt: string): string {
    const matches = this.route(prompt).slice(0, 5);
    if (matches.length === 0) return "No matches found for: " + prompt;
    const lines = [`## Routing: "${prompt}"\n`];
    for (const m of matches) {
      lines.push(`- **${m.type}/${m.name}** (score: ${m.score}) → \`${m.sourceHint}\``);
    }
    return lines.join("\n");
  }
}

// Singleton
let _runtime: QueryEngineRuntime | null = null;
export function getQueryEngineRuntime(): QueryEngineRuntime {
  if (!_runtime) _runtime = new QueryEngineRuntime();
  return _runtime;
}
