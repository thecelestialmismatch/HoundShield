import { KNOWLEDGE_BASE } from "./knowledge-base";
import type { BrainResponse, BrainSummary, Confidence, KnowledgeFact, KnowledgeDomain } from "./types";

// In-memory store — seeded from static knowledge base, updatable at runtime
const store: KnowledgeDomain[] = KNOWLEDGE_BASE.map((d) => ({ ...d, facts: [...d.facts] }));

function scoreMatch(question: string, fact: KnowledgeFact): number {
  const q = question.toLowerCase();
  const text = `${fact.claim} ${fact.tags.join(" ")}`.toLowerCase();
  const words = q.split(/\s+/).filter((w) => w.length > 3);
  const hits = words.filter((w) => text.includes(w)).length;
  return hits / Math.max(words.length, 1);
}

function mergeConfidence(facts: KnowledgeFact[]): Confidence {
  if (facts.some((f) => f.confidence === "high")) return "high";
  if (facts.some((f) => f.confidence === "medium")) return "medium";
  return "low";
}

export function queryBrain(question: string): BrainResponse {
  type Scored = { fact: KnowledgeFact; domain: KnowledgeDomain; score: number };
  const scored: Scored[] = [];

  for (const domain of store) {
    for (const fact of domain.facts) {
      const score = scoreMatch(question, fact);
      // Require ≥40% keyword coverage — single common-word matches are noise
      if (score >= 0.4) scored.push({ fact, domain, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 5);

  if (top.length === 0) {
    return {
      answer: "No matching facts found. Try a more specific compliance question.",
      confidence: "low",
      sources: [],
      domain: "unknown",
      facts: [],
    };
  }

  const topFacts = top.map((s) => s.fact);
  const answer = topFacts
    .map((f) => `• ${f.claim} (${f.confidence} confidence, source: ${f.source})`)
    .join("\n");

  return {
    answer,
    confidence: mergeConfidence(topFacts),
    sources: [...new Set(topFacts.map((f) => f.source))],
    domain: top[0].domain.topic,
    facts: topFacts,
  };
}

export function updateBrain(domainId: string, fact: KnowledgeFact): void {
  const domain = store.find((d) => d.id === domainId);
  if (!domain) throw new Error(`Domain "${domainId}" not found`);
  domain.facts = [...domain.facts, fact];
  domain.lastUpdated = new Date().toISOString().split("T")[0];
}

export function getBrainSummary(): BrainSummary {
  const allUpdates = store.map((d) => d.lastUpdated).sort().reverse();
  return {
    totalFacts: store.reduce((sum, d) => sum + d.facts.length, 0),
    domains: store.map((d) => ({
      id: d.id,
      topic: d.topic,
      factCount: d.facts.length,
      lastUpdated: d.lastUpdated,
    })),
    lastUpdated: allUpdates[0] ?? new Date().toISOString().split("T")[0],
  };
}
