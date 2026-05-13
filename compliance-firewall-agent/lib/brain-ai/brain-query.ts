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

import { SEED_KNOWLEDGE_GRAPH, KGCategory, KGNode, queryKnowledge, upsertNode } from "./knowledge-graph";

export interface BrainResponse {
  answer: string;
  sources: Array<{ domain: KGCategory; title: string; stale: boolean }>;
  confidence: "high" | "medium" | "low";
  suggestion?: string;
}

const STALE_MS = 30 * 24 * 60 * 60 * 1000;
function isStale(node: KGNode): boolean {
  return Date.now() - new Date(node.lastUpdated).getTime() > STALE_MS;
}

// Routing map: question keywords -> preferred category for narrowing
const DOMAIN_ROUTING: Array<{ keywords: string[]; categories: KGCategory[] }> = [
  {
    keywords: ["cmmc", "dfars", "cui", "controlled unclassified", "level 2", "c3pao", "sprs", "nist", "hipaa", "phi", "health", "soc 2", "soc2"],
    categories: ["compliance"],
  },
  {
    keywords: ["nightfall", "strac", "purview", "symantec", "cyberhaven", "netskope", "competitor"],
    categories: ["competitor"],
  },
  {
    keywords: ["market", "revenue", "mrr", "buyer", "jordan", "yc"],
    categories: ["market"],
  },
  {
    keywords: ["customer", "pricing", "price", "tier"],
    categories: ["customer", "product"],
  },
  {
    keywords: ["proxy", "architecture", "scanner", "pattern", "local", "data boundary"],
    categories: ["architecture"],
  },
];

let runtimeGraph = SEED_KNOWLEDGE_GRAPH;

function routeCategories(question: string): KGCategory | undefined {
  const q = question.toLowerCase();
  for (const route of DOMAIN_ROUTING) {
    if (route.keywords.some(k => q.includes(k))) {
      return route.categories[0];
    }
  }
  return undefined;
}

/** Ask the Brain AI a question. Returns structured answer with sources. */
export function ask(question: string): BrainResponse {
  const category = routeCategories(question);
  const results = queryKnowledge(runtimeGraph, { keyword: question, category, limit: 5, minConfidence: 0.7 });

  if (results.length === 0) {
    return {
      answer: "No matching knowledge found. Run /firecrawl-ingest to add sources, or add a node manually via addKnowledge().",
      sources: [],
      confidence: "low",
      suggestion: "Use /firecrawl-ingest to ingest relevant documentation.",
    };
  }

  const answer = results
    .map(r => `[${r.category.toUpperCase()}] **${r.title}**\n${r.content}`)
    .join("\n\n---\n\n");

  const staleCount = results.filter(r => isStale(r)).length;
  const topConfidence = results[0].confidence;
  const confidence: "high" | "medium" | "low" =
    topConfidence > 0.9 ? "high" : topConfidence > 0.8 ? "medium" : "low";

  return {
    answer,
    sources: results.map(r => ({
      domain: r.category,
      title: r.title,
      stale: isStale(r),
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
  domain: KGCategory;
  title: string;
  content: string;
  keywords: string[];
  source: string;
  ttlDays?: number;
}): string {
  const id = `${params.domain}-${Date.now()}`;
  runtimeGraph = upsertNode(runtimeGraph, {
    id,
    category: params.domain,
    title: params.title,
    content: params.keywords.length > 0
      ? `${params.content}\n\nKeywords: ${params.keywords.join(", ")}`
      : params.content,
    confidence: 1.0,
    sources: [params.source],
  });
  return id;
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
