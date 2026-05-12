/**
 * Brain AI v3 — Specialist Agents
 *
 * CMMC-first rule: CMCCAgent and SecurityAgent are fully implemented.
 * HIPAAAgent, SOC2Agent, MarketAgent are Phase 2 stubs — gated until $10K MRR.
 */

import { ReasoningLoop } from "./reasoning-loop";
import { TruthVerifier } from "./truth-verifier";
import { queryKnowledgeGraph } from "./knowledge-graph";

export interface AgentQuery {
  query: string;
  mode?: "fast" | "deep";
  apiKey?: string;
}

export interface AgentResult {
  agent: string;
  answer: string;
  confidence: number;
  sources: string[];
  reasoning_chain?: string[];
  verified: boolean;
}

async function buildContext(query: string, domains: import("./knowledge-graph").KnowledgeDomain[]): Promise<string> {
  const nodes = await queryKnowledgeGraph({ query, domains, limit: 5 });
  if (nodes.length === 0) return "";
  return nodes.map((r) => `[${r.node.id}] ${r.node.title}: ${r.node.content}`).join("\n\n");
}

// ─── CMCCAgent — fully implemented ────────────────────────────────────────

export class CMCCAgent {
  private loop: ReasoningLoop;
  private verifier: TruthVerifier;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.OPENROUTER_API_KEY ?? "";
    this.loop = new ReasoningLoop({
      model: "claude-sonnet-4-6",
      n_iterations: 2,
      apiKey: key,
    });
    this.verifier = new TruthVerifier();
  }

  async run(query: AgentQuery): Promise<AgentResult> {
    const context = await buildContext(query.query, ["cmmc", "nist"]);

    const n_iterations = query.mode === "deep" ? 4 : 2;
    const model = query.mode === "deep" ? "claude-opus-4-7" : "claude-sonnet-4-6";

    const result = await new ReasoningLoop({
      model,
      n_iterations,
      apiKey: query.apiKey ?? process.env.OPENROUTER_API_KEY ?? "",
    }).run(query.query, context);

    const claims = this.verifier.extractClaims(result.answer);
    const report = await this.verifier.verifyAll(claims);

    const sources = (
      await queryKnowledgeGraph({ query: query.query, domains: ["cmmc", "nist"], limit: 3 })
    ).map((r) => r.node.source);

    return {
      agent: "CMCCAgent",
      answer: result.answer,
      confidence: result.confidence,
      sources,
      reasoning_chain: result.reasoning_chain,
      verified: report.allVerified,
    };
  }
}

// ─── SecurityAgent — fully implemented ────────────────────────────────────

export class SecurityAgent {
  private loop: ReasoningLoop;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.OPENROUTER_API_KEY ?? "";
    this.loop = new ReasoningLoop({
      model: "claude-sonnet-4-6",
      n_iterations: 2,
      apiKey: key,
    });
  }

  async run(query: AgentQuery): Promise<AgentResult> {
    const context = await buildContext(query.query, ["cmmc", "nist"]);
    const result = await this.loop.run(
      `Security analysis: ${query.query}`,
      context,
    );

    return {
      agent: "SecurityAgent",
      answer: result.answer,
      confidence: result.confidence,
      sources: ["NIST SP 800-171 Rev 2", "OWASP Top 10", "CMMC Model v2.0"],
      reasoning_chain: result.reasoning_chain,
      verified: result.confidence >= 0.85,
    };
  }
}

// ─── Phase 2 stubs — gated until $10K MRR ─────────────────────────────────

export class HIPAAAgent {
  async run(_query: AgentQuery): Promise<AgentResult> {
    throw new Error("HIPAAAgent not yet — Phase 2, post $10K MRR");
  }
}

export class SOC2Agent {
  async run(_query: AgentQuery): Promise<AgentResult> {
    throw new Error("SOC2Agent not yet — Phase 2, post $10K MRR");
  }
}

export class MarketAgent {
  async run(_query: AgentQuery): Promise<AgentResult> {
    throw new Error("MarketAgent not yet — Phase 2, post $10K MRR");
  }
}
