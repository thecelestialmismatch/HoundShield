/**
 * Brain AI v3 — ReasoningLoop
 *
 * OpenMythos n_loops pattern applied to LLM compliance queries.
 * Each iteration passes: initial_analysis → critique → synthesis → final_answer.
 * Early-exit when confidence exceeds threshold (spectral radius analog).
 *
 * Why iterative reasoning: single-pass LLM answers on CMMC queries are
 * brittle — they miss edge cases and misapply control numbers. Multiple
 * refinement passes converge on higher-confidence, more accurate answers.
 */

import { executeAgentLoop } from "../agent/orchestrator";
import type { AgentStreamEvent } from "../agent/types";

export interface ReasoningLoopConfig {
  model?: string;
  n_iterations?: number;
  confidenceThreshold?: number;
  maxBudgetTokens?: number;
  apiKey?: string;
}

export interface ReasoningResult {
  answer: string;
  confidence: number;
  iterations: number;
  reasoning_chain: string[];
}

const DEFAULT_CONFIG: Required<ReasoningLoopConfig> = {
  model: "claude-sonnet-4-6",
  n_iterations: 4,
  confidenceThreshold: 0.95,
  maxBudgetTokens: 4096,
  apiKey: "",
};

function extractConfidence(text: string): number {
  const match = text.match(/confidence[:\s]+([0-9.]+)/i);
  if (match) {
    const val = parseFloat(match[1]);
    return val > 1 ? val / 100 : val;
  }
  // Infer from hedging language
  if (/\b(definitely|certainly|clearly|must)\b/i.test(text)) return 0.92;
  if (/\b(likely|probably|should)\b/i.test(text)) return 0.78;
  if (/\b(possibly|might|could|unclear)\b/i.test(text)) return 0.55;
  return 0.75;
}

async function llmCall(
  prompt: string,
  systemPrompt: string,
  cfg: Required<ReasoningLoopConfig>,
): Promise<string> {
  const apiKey = cfg.apiKey || process.env.OPENROUTER_API_KEY || "";
  let output = "";

  await executeAgentLoop(
    [{ role: "user", content: prompt }],
    {
      model: cfg.model,
      systemPrompt,
      maxIterations: 1,
      temperature: 0.3,
      apiKey,
      sessionId: `reasoning-loop-${Date.now()}`,
      onEvent: (evt: AgentStreamEvent) => {
        const e = evt as { type: string; content?: string };
        if (e.type === "content" && e.content) output += e.content;
      },
    },
  );

  return output;
}

export class ReasoningLoop {
  private config: Required<ReasoningLoopConfig>;

  constructor(config: ReasoningLoopConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    if (!this.config.apiKey) {
      this.config.apiKey = process.env.OPENROUTER_API_KEY ?? "";
    }
  }

  async run(query: string, context?: string): Promise<ReasoningResult> {
    const systemPrompt =
      "You are a CMMC Level 2 compliance expert. Be precise. Reference specific NIST 800-171 Rev 2 control numbers. After your answer, output: CONFIDENCE: <0.0-1.0>";

    const chain: string[] = [];
    let currentAnswer = "";
    let confidence = 0;

    const contextBlock = context ? `\nContext:\n${context}\n` : "";

    for (let i = 0; i < this.config.n_iterations; i++) {
      let prompt: string;

      if (i === 0) {
        prompt = `${contextBlock}Question: ${query}\n\nProvide an initial analysis.`;
      } else if (i === this.config.n_iterations - 1) {
        prompt = `${contextBlock}Question: ${query}\n\nPrevious reasoning:\n${chain.join("\n\n---\n\n")}\n\nProvide your final, definitive answer. Be specific and cite NIST control numbers.`;
      } else if (i === 1) {
        prompt = `${contextBlock}Question: ${query}\n\nInitial analysis:\n${currentAnswer}\n\nCritique this analysis. What is missing, incorrect, or imprecise? Identify any NIST control numbers that may be wrong.`;
      } else {
        prompt = `${contextBlock}Question: ${query}\n\nPrevious reasoning:\n${chain.join("\n\n---\n\n")}\n\nSynthesize the analysis and critique into a refined answer.`;
      }

      const response = await llmCall(prompt, systemPrompt, this.config);
      chain.push(response);
      currentAnswer = response;
      confidence = extractConfidence(response);

      if (confidence >= this.config.confidenceThreshold) break;
    }

    return {
      answer: currentAnswer,
      confidence,
      iterations: chain.length,
      reasoning_chain: chain,
    };
  }
}
