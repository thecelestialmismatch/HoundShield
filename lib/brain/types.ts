export type Confidence = "high" | "medium" | "low";

export type DomainTopic =
  | "cmmc-l2"
  | "hipaa"
  | "soc2"
  | "competitors"
  | "market"
  | "product-roadmap"
  | "architecture";

export interface KnowledgeFact {
  claim: string;
  evidence: string;
  confidence: Confidence;
  source: string;
  tags: string[];
}

export interface KnowledgeDomain {
  id: string;
  topic: DomainTopic;
  facts: KnowledgeFact[];
  lastUpdated: string; // ISO date
}

export interface BrainResponse {
  answer: string;
  confidence: Confidence;
  sources: string[];
  domain: string;
  facts: KnowledgeFact[];
}

export interface BrainSummary {
  totalFacts: number;
  domains: Array<{ id: string; topic: DomainTopic; factCount: number; lastUpdated: string }>;
  lastUpdated: string;
}
