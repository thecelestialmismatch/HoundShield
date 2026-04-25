/**
 * Brain AI — Public Query Interface
 *
 * Bidirectional interface:
 * - Founder-facing: strategy questions, market decisions
 * - Agent-facing: autonomous context during development
 *
 * Token-efficient: BM25 lookup only, no API call for retrieval.
 * Upgrade to LLM synthesis is optional and model-agnostic.
 */

import { getKnowledgeGraph, KnowledgeDomain } from "./knowledge-graph";

export interface BrainResponse {
  answer: string;
  sources: Array<{ domain: KnowledgeDomain; title: string; stale: boolean }>;
  confidence: "high" | "medium" | "low";
  suggestion?: string;
}

// Routing map: question keywords -> relevant domains
const DOMAIN_ROUTING: Array<{ keywords: string[]; domains: KnowledgeDomain[] }> = [
  {
    keywords: ["cmmc", "dfars", "cui", "controlled unclassified", "level 2", "c3pao", "sprs"],
    domains: ["cmmc", "nist"],
  },
  {
    keywords: ["hipaa", "phi", "health", "patient", "medical"],
    domains: ["hipaa"],
  },
  {
    keywords: ["soc 2", "soc2", "soc ii", "type ii"],
    domains: ["soc2"],
  },
  {
    keywords: ["nightfall", "strac", "purview", "symantec", "cyberhaven", "netskope", "competitor"],
    domains: ["competitor"],
  },
  {
    keywords: ["market", "customer", "revenue", "mrr", "buyer", "jordan", "pricing", "yc"],
    domains: ["market", "customer", "pricing"],
  },
  {
    keywords: ["proxy", "architecture", "scanner", "pattern", "local", "data boundary"],
    domains: ["architecture"],
  },
];

function routeDomains(question: string): KnowledgeDomain[] | undefined {
  const q = question.toLowerCase();
  const matched = new Set<KnowledgeDomain>();
  for (const route of DOMAIN_ROUTING) {
    if (route.keywords.some(k => q.includes(k))) {
      route.domains.forEach(d => matched.add(d));
    }
  }
  return matched.size > 0 ? Array.from(matched) : undefined;
}

/** Ask the Brain AI a question. Returns structured answer with sources. */
export function ask(question: string): BrainResponse {
  const graph = getKnowledgeGraph();
  const domains = routeDomains(question);
  const results = graph.query({ query: question, domains, limit: 5 });

  // Discard low-signal results — BM25 incidental common-word matches stay below 2
  const relevant = results.filter(r => r.score >= 2);
  if (relevant.length === 0) {
    return {
      answer: `No knowledge found for: "${question}". Run /firecrawl-ingest to add sources, or add a node manually via addKnowledge().`,
      sources: [],
      confidence: "low",
      suggestion: "Use /firecrawl-ingest to ingest relevant documentation.",
    };
  }

  const answer = relevant
    .map(r => `[${r.node.domain.toUpperCase()}] **${r.node.title}**\n${r.node.content}`)
    .join("\n\n---\n\n");

  const staleCount = relevant.filter(r => r.stale).length;
  const confidence: "high" | "medium" | "low" =
    relevant[0].score > 5 ? "high" : relevant[0].score > 2 ? "medium" : "low";

  return {
    answer,
    sources: relevant.map(r => ({
      domain: r.node.domain,
      title: r.node.title,
      stale: r.stale,
    })),
    confidence,
    suggestion:
      staleCount > 0
        ? `${staleCount} source(s) are stale. Run /firecrawl-ingest to refresh.`
        : undefined,
  };
}

/** Add new knowledge to the graph (for agent-driven updates) */
export function addKnowledge(params: {
  domain: KnowledgeDomain;
  title: string;
  content: string;
  keywords: string[];
  source: string;
  ttlDays?: number;
}): string {
  const graph = getKnowledgeGraph();
  const node = graph.addNode({
    domain: params.domain,
    title: params.title,
    content: params.content,
    keywords: params.keywords,
    source: params.source,
    sourceType: "manual",
    ttl: (params.ttlDays ?? 0) * 24 * 60 * 60 * 1000,
    weight: 1.0,
  });
  return node.id;
}

/** Quick competitive intelligence lookup */
export function askCompetitor(competitor: string): string {
  const result = ask(`${competitor} DLP features pricing architecture`);
  return result.answer;
}

/** Quick CMMC control lookup */
export function askCMMC(controlId: string): string {
  const result = ask(`CMMC control ${controlId}`);
  return result.answer;
}

/** Market validation check -- is the problem real and urgent? */
export function marketCheck(): string {
  const result = ask("market size urgency workaround customer behavior");
  return result.answer;
}
