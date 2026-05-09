/**
 * houndshield Brain AI — Compressed Knowledge Graph
 *
 * Token-efficient self-evolving knowledge store.
 * Structured as typed nodes — no raw conversation history.
 * Updated automatically as product evolves.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface KGNode {
  id: string;
  category: KGCategory;
  title: string;
  content: string;
  confidence: number; // 0–1, lower = needs verification
  lastUpdated: string; // ISO date
  sources?: string[];
}

export type KGCategory =
  | "compliance"   // CMMC, HIPAA, SOC2 rules and controls
  | "competitor"   // Nightfall, Strac, Cloudflare, Forcepoint intel
  | "market"       // TAM, segments, pricing data, enforcement deadlines
  | "architecture" // Technical decisions and patterns
  | "product"      // Features, roadmap, pricing
  | "customer"     // ICP, pain points, buyer journey
  | "legal";       // Data residency, regulatory requirements

export interface KnowledgeGraph {
  version: string;
  lastFullUpdate: string;
  nodes: KGNode[];
}

// ─── Seed Knowledge Graph ────────────────────────────────────────────────────
// This is the bootstrap graph. The firecrawl updater enriches it over time.

export const SEED_KNOWLEDGE_GRAPH: KnowledgeGraph = {
  version: "2.0.0",
  lastFullUpdate: new Date().toISOString(),
  nodes: [
    // COMPLIANCE
    {
      id: "cmmc-level2-overview",
      category: "compliance",
      title: "CMMC Level 2 Overview",
      content: "CMMC Level 2 maps to NIST SP 800-171 — 110 controls across 14 domains. Requires a C3PAO third-party assessment (no self-attestation). Phase 2 enforcement begins November 2026 for new DoD contracts. Organizations must demonstrate technical controls for any system that processes CUI.",
      confidence: 0.99,
      lastUpdated: "2026-04-25",
      sources: ["https://www.acq.osd.mil/cmmc/", "https://csrc.nist.gov/publications/detail/sp/800-171/rev-3/final"],
    },
    {
      id: "cmmc-cui-definition",
      category: "compliance",
      title: "CUI — Controlled Unclassified Information",
      content: "CUI is government-created information requiring safeguarding per law, regulation, or government-wide policy. Categories relevant to defense contractors: Technical Data, Export Controlled, Critical Infrastructure, Privacy, Law Enforcement. CAGE codes, contract numbers, clearance levels, and ITAR-controlled technical specs are all CUI. Sending CUI to an unauthorized third-party system (including cloud AI services) violates CMMC AC.1.001 and SC.3.177.",
      confidence: 0.99,
      lastUpdated: "2026-04-25",
    },
    {
      id: "cmmc-ai-tool-risk",
      category: "compliance",
      title: "AI Tool Risk Under CMMC",
      content: "When an engineer pastes CUI into ChatGPT, Copilot, or Claude: (1) CUI reaches an unauthorized external system — CMMC violation. (2) No audit trail exists — AU.2.041/AU.2.042 violation. (3) Data may be used to train external models — export control risk. C3PAO assessors are now explicitly asking about AI tool governance controls. A policy document is not a technical control and will not satisfy the assessment.",
      confidence: 0.97,
      lastUpdated: "2026-04-25",
    },
    {
      id: "nist-800-171-key-controls",
      category: "compliance",
      title: "NIST 800-171 Controls houndshield Addresses",
      content: "AC.1.001 — Limit system access to authorized users and processes (proxy enforces AI access policy). AU.2.041 — Trace actions of individual users (audit log per user per prompt). AU.2.042 — Create and retain audit logs (SHA-256 chain, immutable). CM.2.061 — Establish baseline configurations (proxy config as code). SC.3.177 — FIPS-validated cryptography (SHA-256 for audit chain). SI.1.210 — Identify and correct system flaws (pattern update mechanism).",
      confidence: 0.98,
      lastUpdated: "2026-04-25",
    },
    {
      id: "hipaa-phi-ai-risk",
      category: "compliance",
      title: "HIPAA PHI Risk in AI Tools",
      content: "PHI sent to a cloud AI service requires a Business Associate Agreement (BAA). OpenAI, Anthropic, and Google do not offer BAAs for standard API/consumer products. Without a BAA, sending any PHI to these services is a HIPAA violation. Healthcare IT teams using Copilot or ChatGPT for clinical documentation are at high risk. houndshield blocks PHI patterns before they reach any service — no BAA negotiation required.",
      confidence: 0.96,
      lastUpdated: "2026-04-25",
    },
    {
      id: "soc2-ai-governance",
      category: "compliance",
      title: "SOC 2 AI Governance Requirements",
      content: "SOC 2 Type II auditors are increasingly asking about AI tool governance as a Logical Access control. The Trust Services Criteria CC6.1 (logical access controls) and CC6.6 (third-party risk) both apply to AI tool usage. Demonstrating a technical control that restricts what data reaches AI services satisfies both criteria.",
      confidence: 0.92,
      lastUpdated: "2026-04-25",
    },

    // COMPETITORS
    {
      id: "competitor-nightfall",
      category: "competitor",
      title: "Nightfall AI — Competitor Analysis",
      content: "Nightfall AI: cloud-native ML DLP. Pricing: $8K-$20K/yr SMB, $25K-$60K mid-market, $75K-$200K enterprise. Cloud-only — prompt content processed on Nightfall's servers. This makes it non-compliant for CMMC CUI handling. Focused on SaaS data loss prevention (Slack, GitHub, Google Drive), not AI proxy interception specifically. No CMMC-specific detection patterns. No C3PAO audit PDF. Weeks to deploy. Primary differentiation for houndshield: local-only processing, CMMC patterns, 15-min setup, $199/mo entry.",
      confidence: 0.91,
      lastUpdated: "2026-04-25",
      sources: ["https://www.nightfall.ai/pricing"],
    },
    {
      id: "competitor-cloudflare-ai-gateway",
      category: "competitor",
      title: "Cloudflare AI Gateway — Competitor Analysis",
      content: "Cloudflare AI Gateway: free on all plans, DLP scanning included. Processes all prompt data on Cloudflare's infrastructure — cloud-based. No CMMC-specific patterns. No local processing option. No C3PAO audit PDF. The free tier is a real threat for low-security use cases but legally non-compliant for CUI under CMMC. houndshield differentiator: local-only = CMMC-legal, CMMC-specific patterns, audit PDF for assessors.",
      confidence: 0.95,
      lastUpdated: "2026-04-25",
    },
    {
      id: "competitor-strac",
      category: "competitor",
      title: "Strac — Competitor Analysis",
      content: "Strac: DLP for SaaS and AI, focused on SOC 2 compliance. Cloud-based scanning. No local processing. Price range not publicly disclosed — enterprise sales motion. Not specialized for CMMC. Growing AI DLP focus. houndshield differentiation: CMMC-specific, local-only, 15-min setup, transparent pricing.",
      confidence: 0.82,
      lastUpdated: "2026-04-25",
    },
    {
      id: "competitor-forcepoint",
      category: "competitor",
      title: "Forcepoint — Competitor Analysis",
      content: "Forcepoint DLP: enterprise-grade, on-premise option available. $100K+ implementation cost. Months to deploy. Requires dedicated IT team. No AI proxy interception model — designed for endpoint/network DLP. No CMMC-specific AI tool patterns. Target customer is 1000+ employee organizations with dedicated security teams. houndshield differentiation: SMB accessible ($199/mo), 15-min Docker setup, AI-proxy-specific.",
      confidence: 0.87,
      lastUpdated: "2026-04-25",
    },

    // MARKET
    {
      id: "market-cmmc-tam",
      category: "market",
      title: "CMMC Market Size",
      content: "80,000-300,000 US defense contractors need CMMC Level 2 certification. Only ~400 (0.5%) currently certified. C3PAO assessment costs $30K-$76K, rising to ~$150K by late 2026 as demand exceeds assessor capacity. November 2026 = Phase 2 enforcement (new DoD contracts require CMMC). This is a hard deadline-driven TAM with concentrated pain. At $499/mo average: 20 customers = $10K MRR, 200 customers = $100K MRR, 2000 customers = $1M MRR.",
      confidence: 0.94,
      lastUpdated: "2026-04-25",
    },
    {
      id: "market-beachhead-segment",
      category: "market",
      title: "Beachhead: SMB Defense Contractors",
      content: "Target: 50-500 employee US defense contractors with active DoD contracts preparing for CMMC Level 2. Buyer: ISSO or IT Security Manager. Decision timeline: 1-4 weeks (deadline pressure accelerates). Budget authority: can approve $199-$499/mo without procurement cycle. Pain: engineers using AI tools daily, no CUI controls, assessor coming. Current workaround: firewall blocks (kills productivity) or policy docs (zero enforcement). Both fail the assessor.",
      confidence: 0.96,
      lastUpdated: "2026-04-25",
    },

    // PRODUCT
    {
      id: "product-core-architecture",
      category: "architecture",
      title: "houndshield Core Architecture",
      content: "Single proxy URL intercepts all AI API traffic. Pattern matching runs locally in-process — no cloud call for scanning. Supported models: any OpenAI-compatible API endpoint (ChatGPT, Claude, Gemini, Copilot). Scan latency: <10ms for standard patterns on 4KB input. Audit log: append-only with SHA-256 hash chain (tamper-evident). Stack: Next.js 15, TypeScript strict, Supabase, Stripe. Data residency: 100% on-premise, zero external transmission of prompt content.",
      confidence: 0.99,
      lastUpdated: "2026-04-25",
    },
    {
      id: "product-legal-moat",
      category: "legal",
      title: "Local-Only Legal Moat",
      content: "Under NIST SP 800-171 requirement SC.3.177 and the CUI Program (32 CFR Part 2002), CUI must be protected using FIPS-validated cryptographic mechanisms and may not be processed by unauthorized external parties. Cloud DLP vendors (Nightfall, Strac, Cloudflare) process prompt content on their servers — this constitutes transmission of CUI to an unauthorized external system, which is itself a CMMC violation. houndshield's local-only architecture means the DLP scan is the compliant path, not a secondary control. This moat is legal, not just technical.",
      confidence: 0.95,
      lastUpdated: "2026-04-25",
    },

    // CUSTOMER
    {
      id: "customer-isso-profile",
      category: "customer",
      title: "Primary Buyer: ISSO at Defense Contractor",
      content: "Job title: ISSO, IT Security Manager, or CISO. Company: 50-500 employees. DoD contract active. CMMC assessment scheduled in next 6-12 months. Knows engineers use ChatGPT and Copilot. Has no technical answer for the C3PAO AI tool governance question. WTP: $199-$499/mo when framed as 'contract protection, not compliance cost'. Discovery channel: r/CMMC, LinkedIn (searches: CMMC Level 2, CUI, DFARS compliance), C3PAO pre-assessment interviews. Key objection: 'Will this break anything?' Answer: One URL change, zero behavior change for engineers.",
      confidence: 0.93,
      lastUpdated: "2026-04-25",
    },
  ],
};

// ─── Query Functions ─────────────────────────────────────────────────────────

/**
 * Query the knowledge graph by category and/or keyword.
 * Returns relevant nodes sorted by confidence.
 */
export function queryKnowledge(
  graph: KnowledgeGraph,
  options: {
    category?: KGCategory;
    keyword?: string;
    limit?: number;
    minConfidence?: number;
  }
): KGNode[] {
  const { category, keyword, limit = 5, minConfidence = 0.7 } = options;

  let nodes = graph.nodes.filter((n) => n.confidence >= minConfidence);

  if (category) {
    nodes = nodes.filter((n) => n.category === category);
  }

  if (keyword) {
    const kw = keyword.toLowerCase();
    nodes = nodes.filter(
      (n) =>
        n.title.toLowerCase().includes(kw) ||
        n.content.toLowerCase().includes(kw)
    );
  }

  return nodes
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}

/**
 * Build a compressed context string for LLM injection.
 * Token-efficient: only relevant nodes, no duplication.
 */
export function buildCompressedContext(
  graph: KnowledgeGraph,
  query: string,
  maxNodes = 4
): string {
  const relevant = queryKnowledge(graph, { keyword: query, limit: maxNodes });

  if (relevant.length === 0) {
    return "No specific knowledge graph entries match this query. Answer from general houndshield product knowledge.";
  }

  const sections = relevant.map(
    (n) => `[${n.category.toUpperCase()} — ${n.title}]\n${n.content}`
  );

  return sections.join("\n\n---\n\n");
}

/**
 * Add or update a node in the knowledge graph.
 * Used by the firecrawl updater and manual enrichment.
 */
export function upsertNode(
  graph: KnowledgeGraph,
  node: Omit<KGNode, "lastUpdated">
): KnowledgeGraph {
  const updated = new Date().toISOString().split("T")[0];
  const existing = graph.nodes.findIndex((n) => n.id === node.id);

  const newNode: KGNode = { ...node, lastUpdated: updated };

  if (existing >= 0) {
    const updatedNodes = [...graph.nodes];
    updatedNodes[existing] = newNode;
    return { ...graph, nodes: updatedNodes };
  }

  return { ...graph, nodes: [...graph.nodes, newNode] };
}

/**
 * Manager Mode: Check if current work aligns with PRD phase.
 * Returns null if aligned, or a flag message if off-plan.
 */
export function managerModeCheck(
  query: string
): { flagged: boolean; message: string } | null {
  const offPlanSignals = [
    { pattern: /hipaa|healthcare/i, phase: "Phase 2", condition: "before $10K MRR" },
    { pattern: /soc.?2|startup|fintech/i, phase: "Phase 2", condition: "before $10K MRR" },
    { pattern: /kubernetes|k8s|air.gap/i, phase: "Phase 3", condition: "before $30K MRR" },
    { pattern: /white.label|msp|resell/i, phase: "Phase 3", condition: "before $30K MRR" },
    { pattern: /machine.learn|ml.model|predictive/i, phase: "Phase 4", condition: "before $100K MRR" },
  ];

  for (const signal of offPlanSignals) {
    if (signal.pattern.test(query)) {
      return {
        flagged: true,
        message: `MANAGER CHECK: This looks like ${signal.phase} work (${signal.condition}). Current focus is CMMC beachhead — $0 to $10K MRR. Is this intentional? If so, update the PRD (docs/PRD.md) before proceeding.`,
      };
    }
  }

  return null;
}

// ─── Backward-compat shims ───────────────────────────────────────────────────
// brain-query.ts and specialist-agents.ts expect a class-based API.

export type KnowledgeDomain = KGCategory;

interface QueryResult {
  node: KGNode & { domain: KGCategory };
  score: number;
  stale: boolean;
}

export function getKnowledgeGraph() {
  return {
    query({ query, domains, limit = 5 }: { query: string; domains?: KGCategory[]; limit?: number }): QueryResult[] {
      const results = queryKnowledge(SEED_KNOWLEDGE_GRAPH, {
        keyword: query,
        category: domains?.[0],
        limit,
      });
      return results.map((node) => ({
        node: { ...node, domain: node.category },
        score: node.confidence * 10,
        stale: false,
      }));
    },
    addNode(params: { domain: KGCategory; title: string; content: string; keywords?: string[]; source?: string; [k: string]: unknown }): KGNode {
      const newNode: KGNode = {
        id: `${params.domain}-${Date.now()}`,
        category: params.domain,
        title: params.title,
        content: params.content,
        confidence: 0.8,
        lastUpdated: new Date().toISOString().split("T")[0],
      };
      SEED_KNOWLEDGE_GRAPH.nodes.push(newNode);
      return newNode;
    },
  };
}

export async function queryKnowledgeGraph({ query, domains, limit = 5 }: {
  query: string;
  domains?: KGCategory[];
  limit?: number;
}): Promise<QueryResult[]> {
  const results = queryKnowledge(SEED_KNOWLEDGE_GRAPH, {
    keyword: query,
    category: domains?.[0],
    limit,
  });
  return results.map((node) => ({
    node: { ...node, domain: node.category },
    score: node.confidence * 10,
    stale: false,
  }));
}
