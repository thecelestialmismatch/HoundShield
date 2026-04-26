/**
 * Brain AI — Knowledge Graph
 *
 * Token-efficient persistent knowledge store for HoundShield.
 * Replaces static brain/research.md with a queryable, self-updating graph.
 *
 * Design:
 * - Nodes are compressed domain summaries, not raw documents
 * - BM25-style keyword index for fast lookup
 * - TTL-aware: regulatory facts are permanent, competitor data expires in 7 days
 * - Bidirectional: founder queries (strategy) and agent queries (context)
 * - Zero API calls for lookup -- pure in-memory BM25 search
 */

export type KnowledgeDomain =
  | "cmmc"
  | "hipaa"
  | "soc2"
  | "nist"
  | "competitor"
  | "market"
  | "architecture"
  | "pricing"
  | "customer";

export type KnowledgeSource = "static" | "firecrawl" | "browser" | "manual";

export interface KnowledgeNode {
  id: string;
  domain: KnowledgeDomain;
  title: string;
  content: string;
  keywords: string[];
  source: string;
  sourceType: KnowledgeSource;
  createdAt: number;
  updatedAt: number;
  /** Milliseconds until stale. 0 = permanent. */
  ttl: number;
  /** Importance weight 0-1 for ranking */
  weight: number;
}

export interface KnowledgeQuery {
  query: string;
  domains?: KnowledgeDomain[];
  limit?: number;
  includeStale?: boolean;
}

export interface KnowledgeResult {
  node: KnowledgeNode;
  score: number;
  stale: boolean;
}

// ---------------------------------------------------------------------------
// BM25-lite scorer (k1=1.5, b=0.75)
// Fast enough for in-memory graph with <10K nodes
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with","by",
  "is","it","its","this","that","these","those","are","was","were","be","been",
  "have","has","had","do","does","did","will","would","could","should","may",
  "might","can","not","no","nor","so","yet","both","either","neither","each",
  "few","more","most","other","some","such","than","then","than","too","very",
  "just","also","only","ever","never","always","often","asks","tell","about",
  "from","into","over","under","after","before","between","through","during",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOPWORDS.has(t));
}

function bm25Score(
  query: string[],
  doc: string[],
  avgDocLen: number,
  idf: Map<string, number>
): number {
  const k1 = 1.5;
  const b = 0.75;
  const docLen = doc.length;
  const freqMap = new Map<string, number>();
  for (const t of doc) freqMap.set(t, (freqMap.get(t) ?? 0) + 1);

  let score = 0;
  for (const term of query) {
    const tf = freqMap.get(term) ?? 0;
    if (tf === 0) continue;
    const termIdf = idf.get(term) ?? 0;
    const num = tf * (k1 + 1);
    const denom = tf + k1 * (1 - b + b * (docLen / avgDocLen));
    score += termIdf * (num / denom);
  }
  return score;
}

// ---------------------------------------------------------------------------
// KnowledgeGraph singleton
// ---------------------------------------------------------------------------

export class KnowledgeGraph {
  private nodes: Map<string, KnowledgeNode> = new Map();

  constructor(seed?: KnowledgeNode[]) {
    if (seed) {
      for (const node of seed) {
        this.nodes.set(node.id, node);
      }
    } else {
      this.loadSeedKnowledge();
    }
  }

  addNode(node: Omit<KnowledgeNode, "id" | "createdAt" | "updatedAt">): KnowledgeNode {
    const id = `${node.domain}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const full: KnowledgeNode = {
      ...node,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.nodes.set(id, full);
    return full;
  }

  updateNode(id: string, content: string): boolean {
    const node = this.nodes.get(id);
    if (!node) return false;
    this.nodes.set(id, { ...node, content, updatedAt: Date.now() });
    return true;
  }

  isStale(node: KnowledgeNode): boolean {
    if (node.ttl === 0) return false;
    return Date.now() - node.updatedAt > node.ttl;
  }

  query(params: KnowledgeQuery): KnowledgeResult[] {
    const { query, domains, limit = 5, includeStale = false } = params;
    const queryTokens = tokenize(query);

    const candidates = Array.from(this.nodes.values()).filter(n => {
      if (!includeStale && this.isStale(n)) return false;
      if (domains && !domains.includes(n.domain)) return false;
      return true;
    });

    if (candidates.length === 0) return [];

    // Build IDF map
    const df = new Map<string, number>();
    const tokenizedDocs = candidates.map(n => tokenize(n.content + " " + n.keywords.join(" ")));
    for (const tokens of tokenizedDocs) {
      const seen = new Set(tokens);
      for (const t of seen) df.set(t, (df.get(t) ?? 0) + 1);
    }
    const N = candidates.length;
    const idf = new Map<string, number>();
    for (const [term, freq] of df.entries()) {
      idf.set(term, Math.log((N - freq + 0.5) / (freq + 0.5) + 1));
    }
    const avgDocLen = tokenizedDocs.reduce((s, d) => s + d.length, 0) / N;

    const scored: KnowledgeResult[] = candidates.map((node, i) => ({
      node,
      score: bm25Score(queryTokens, tokenizedDocs[i], avgDocLen, idf) * node.weight,
      stale: this.isStale(node),
    }));

    return scored
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /** Answer a natural language question using the top matching nodes */
  answer(question: string, domains?: KnowledgeDomain[]): string {
    const results = this.query({ query: question, domains, limit: 3 });
    if (results.length === 0) {
      return `No knowledge found for: "${question}". Use /firecrawl-ingest to add relevant sources.`;
    }
    const context = results
      .map(r => `[${r.node.domain.toUpperCase()}] ${r.node.title}\n${r.node.content}`)
      .join("\n\n---\n\n");
    return context;
  }

  /** List all nodes by domain */
  listDomain(domain: KnowledgeDomain): KnowledgeNode[] {
    return Array.from(this.nodes.values()).filter(n => n.domain === domain);
  }

  /** Export graph as compressed JSON for persistence */
  export(): string {
    return JSON.stringify(Array.from(this.nodes.values()), null, 2);
  }

  /** Load seed knowledge (CMMC, competitor, market data) */
  private loadSeedKnowledge(): void {
    const seed = getSeedKnowledge();
    for (const node of seed) {
      this.nodes.set(node.id, node);
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

let _graph: KnowledgeGraph | null = null;

export function getKnowledgeGraph(): KnowledgeGraph {
  if (!_graph) _graph = new KnowledgeGraph();
  return _graph;
}

// ---------------------------------------------------------------------------
// Seed knowledge -- permanent nodes (ttl: 0), manually maintained
// These are the foundation the Brain AI needs to answer any question
// ---------------------------------------------------------------------------

function node(
  id: string,
  domain: KnowledgeDomain,
  title: string,
  content: string,
  keywords: string[]
): KnowledgeNode {
  return {
    id,
    domain,
    title,
    content,
    keywords,
    source: "static",
    sourceType: "static",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ttl: 0,
    weight: 1.0,
  };
}

export function getSeedKnowledge(): KnowledgeNode[] {
  return [
    // ---- CMMC ----
    node(
      "cmmc_core_moat",
      "cmmc",
      "Why local-only scanning is a CMMC regulatory requirement, not a feature",
      `DFARS 7012 requires CUI to remain within the contractor's protected environment.
Every cloud-based AI DLP vendor (Nightfall, Strac, Cyberhaven, Netskope) sends CUI to
their servers for scanning. That act of sending CUI for external scanning is itself a
potential DFARS 7012 violation. HoundShield scans locally -- nothing leaves the network.
This is not a marketing claim. It is a regulatory architecture requirement that cloud
competitors cannot copy without rebuilding their entire product.
The exact sentence: "Every cloud-based AI DLP tool sends your CUI to their servers to
scan it. That is itself a potential CUI spill under DFARS 7012. HoundShield scans
everything locally. Nothing leaves your network."`,
      ["dfars", "7012", "cui", "local", "cloud", "moat", "violation", "scanning", "network"]
    ),
    node(
      "cmmc_timeline",
      "cmmc",
      "CMMC enforcement timeline and urgency",
      `CMMC Phase 1: November 2024 -- new DoD contracts can require CMMC Level 1.
CMMC Phase 2: November 10, 2026 -- most contracts handling CUI require Level 2 certification.
Current state: ~80,000 contractors need CMMC Level 2. ~400 are certified.
The gap represents ~79,600 potential customers in a 18-month window.
Contractors who miss the deadline risk contract loss on renewal.
Average C3PAO assessment cost: $30K-$150K. Schedule is months out.
HoundShield helps contractors reduce scope, pass assessments, and maintain controls.`,
      ["cmmc", "phase", "enforcement", "deadline", "november", "2026", "contractor", "certification", "80000"]
    ),
    node(
      "cmmc_controls",
      "cmmc",
      "Key CMMC Level 2 controls that HoundShield directly addresses",
      `AC.L2-3.1.3: Control the flow of CUI per approved authorizations -- AI tools are in scope.
HoundShield enforces: proxy intercepts all AI traffic, blocks CUI from reaching external AI.
AU.L2-3.3.1: Audit and log actions on systems processing CUI.
HoundShield enforces: every AI request logged with timestamp, content summary, action taken.
SI.L2-3.14.1: Identify, report, and correct information system flaws including CUI leaks via AI.
HoundShield enforces: real-time threat detection, quarantine, alerting, PDF evidence package.
Total CMMC Level 2 controls: 110 (all 110 mapped in SPRS scoring engine).
Controls where HoundShield provides direct evidence: AC.L2, AU.L2, SI.L2 families.`,
      ["ac.l2", "au.l2", "si.l2", "controls", "audit", "log", "flow", "cui", "evidence", "c3pao", "nist"]
    ),
    node(
      "cmmc_buyer_jordan",
      "customer",
      "Primary buyer persona: Jordan",
      `Title: IT Security Manager or Compliance Manager.
Company: 50-250 person DoD subcontractor.
Situation: Prime contractor issued CMMC mandate. C3PAO pre-assessment booked within 90 days.
Engineers use ChatGPT and Copilot daily. Jordan has zero visibility into what they are sending.
Pain trigger: C3PAO questionnaire asks 'What controls do you have on AI tool usage?'
Jordan cannot answer. She needs something she can deploy in a day and hand to an auditor as evidence.
Budget: Already spending $30K-$150K on C3PAO assessment fees. $200-500/month is cheap.
What makes her pay: PDF audit report she can hand to an auditor, not a dashboard.
What does NOT make her pay: virtual office, AI memory, workspace, generic productivity tools.`,
      ["jordan", "ciso", "it manager", "compliance", "auditor", "c3pao", "defense", "contractor", "chatgpt", "copilot"]
    ),
    node(
      "cmmc_channel",
      "market",
      "C3PAO distribution channel strategy",
      `C3PAO = Certified Third-Party Assessor Organization. DoD-certified to audit contractors.
Each C3PAO has 20-100 contractor clients who are actively trying to get CMMC compliant.
One C3PAO conversation = potentially 10-50 paying customers.
Where to find: CMMC-AB Marketplace (marketplace.cmmcab.org/s/find-a-c3pao)
CMMC Registered Practitioners: more numerous, more accessible than C3PAO firms.
C3PAO referral program: HoundShield pays commission per referred customer.
Message to C3PAOs: "Do any of your clients have AI tool controls in place?"
Most will say no. HoundShield fills the gap.`,
      ["c3pao", "referral", "channel", "distribution", "marketplace", "cmmc-ab", "practitioner"]
    ),
    node(
      "cmmc_sprs",
      "cmmc",
      "SPRS scoring and what it means for HoundShield",
      `SPRS = Supplier Performance Risk System. DoD system where contractors self-report security score.
Score range: -203 to +110. Most contractors have negative scores.
A negative score means high risk -- may disqualify from contracts.
NIST 800-171 has 110 controls, each with a deduction weight if failed.
HoundShield directly improves SPRS score by addressing AC, AU, SI control families.
Estimated SPRS improvement from deploying HoundShield: +15 to +30 points.
This is a concrete, quantifiable value proposition Jordan can put in her SPRS attestation.`,
      ["sprs", "score", "nist", "800-171", "controls", "deduction", "attestation", "improvement"]
    ),

    // ---- Competitors ----
    node(
      "competitor_nightfall",
      "competitor",
      "Nightfall DLP -- competitive analysis",
      `Nightfall is a cloud-based AI DLP platform. Key facts:
Architecture: cloud-only. CUI is sent to Nightfall servers for scanning.
CMMC compliance: CANNOT claim CMMC-compliant scanning because CUI leaves the network.
Strengths: polished UI, broad integration set, enterprise sales team.
Weaknesses: cloud architecture is itself a DFARS 7012 risk. No CMMC-specific patterns. No PDF audit report.
Pricing: enterprise ($$$+). Not accessible to 50-person defense contractors.
HoundShield differentiation: local-only, CMMC-specific patterns, PDF C3PAO evidence.`,
      ["nightfall", "cloud", "dlp", "dfars", "enterprise", "competitor", "saas"]
    ),
    node(
      "competitor_strac",
      "competitor",
      "Strac DLP -- competitive analysis (most relevant threat)",
      `Strac is the closest competitor. Key facts:
Architecture: cloud-based with MCP DLP integration.
CMMC compliance: cloud architecture disqualifies them for on-premise CMMC.
Strengths: MCP DLP (first mover there), developer-friendly API, active product team.
Weaknesses: no on-premise option, no CMMC-specific patterns, no PDF C3PAO report.
Threat level: MEDIUM. If Strac ships an on-premise SKU with CMMC patterns they compete directly.
Watch: Strac's GitHub and product blog monthly.
HoundShield advantage: CMMC-specific C3PAO evidence package is not on Strac's roadmap.`,
      ["strac", "mcp", "dlp", "on-premise", "competitor", "threat"]
    ),
    node(
      "competitor_purview",
      "competitor",
      "Microsoft Purview -- the default choice for M365 shops",
      `Microsoft Purview is the default AI DLP for organizations running M365.
Architecture: cloud-based, Purview compliance center processes data in Microsoft's cloud.
CMMC compliance: Microsoft has a GCC High environment which is ITAR/CUI-compliant, BUT
the AI DLP scanning component sends data to Azure cloud -- not the customer's local network.
Market share: ~70% of DoD contractors run M365. Purview is bundled with E5.
Threat level: HIGH for the long term. Microsoft will improve AI DLP continuously.
HoundShield defense: multi-AI support (not just Copilot), on-premise Docker deployment,
PDF audit report format that Purview doesn't generate, CMMC-specific control mapping.`,
      ["microsoft", "purview", "m365", "copilot", "gcc", "high", "e5", "competitor"]
    ),
    node(
      "competitor_symantec",
      "competitor",
      "Symantec (Broadcom) DLP -- legacy on-premise option",
      `Symantec DLP (now Broadcom) is the only established on-premise DLP option.
Architecture: on-premise deployment available.
CMMC compliance: can claim on-premise -- but has no AI-specific patterns or ChatGPT/Copilot support.
Pricing: enterprise license, $$$$$. 6-month deployment. Requires dedicated staff.
Target customer: Fortune 500 defense primes (Raytheon, Lockheed). Not SMB contractors.
Threat level: LOW for HoundShield's beachhead (50-250 person contractors).
HoundShield advantage: Docker install in minutes vs 6-month Symantec deployment.`,
      ["symantec", "broadcom", "on-premise", "legacy", "enterprise", "dlp"]
    ),

    // ---- Architecture ----
    node(
      "arch_data_boundary",
      "architecture",
      "Local-only data boundary -- the sacred constraint",
      `ON-DEVICE (never leaves customer infrastructure):
- All AI prompt content
- All CUI detection results
- All audit logs and compliance reports
- Pattern matching engine output
- Scanner results

EXTERNAL (hashed/aggregate only):
- License key hash (no prompt content, just a hash of the key)
- Prompt count aggregate for billing (a number, not content)

Any change that could cause prompt content to cross this boundary is a CRITICAL
security finding. Stop all work, invoke team-lead agent immediately.
This boundary is the product's core technical moat and legal compliance requirement.`,
      ["data boundary", "local", "prompt", "cui", "exfiltration", "security", "dfars", "constraint"]
    ),
    node(
      "arch_proxy_flow",
      "architecture",
      "Proxy interception flow",
      `Employee sends AI request (ChatGPT, Copilot, Claude API, etc.)
  -> Request hits HoundShield proxy (configured via proxy URL change)
  -> Scanner runs 16 CUI/PII/PHI/secret patterns (<10ms)
  -> CUI detected? Block + log + quarantine + alert
  -> Clean? Forward to AI provider transparently
  -> All events written to audit log
  -> PDF report generated on demand

One URL change deploys HoundShield. Employees don't change behavior.
Proxy runs in Docker. Default port 8080.
HTTPS interception uses mitmproxy-compatible certificate.`,
      ["proxy", "intercept", "scanner", "pattern", "10ms", "docker", "url", "chatgpt", "copilot"]
    ),

    // ---- Market ----
    node(
      "market_size",
      "market",
      "Market size and revenue path",
      `Total addressable: ~80,000 DoD contractors needing CMMC Level 2.
Serviceable (50-250 employees, active AI tool use): ~20,000 contractors.
Price range: $199-$499/month per contractor.
Revenue at 1% penetration of serviceable market: ~$4M ARR.
Revenue target: $10K MRR by October 2026.
Path: 1 customer -> 3 C3PAO partners -> 30 customers -> 50 customers.
YC target: S26 application with $10K MRR traction.`,
      ["tam", "market", "revenue", "mrr", "yc", "customers", "penetration", "arr"]
    ),
    node(
      "market_workaround",
      "market",
      "What customers do instead of HoundShield (current behavior = competitor)",
      `Current workarounds in order of prevalence:
1. Do nothing -- hope the auditor doesn't ask about AI tool controls (most common)
2. Block ChatGPT at DNS level -- bypassed via mobile, personal hotspot, VPN
3. Write a policy document -- unenforceable, C3PAOs are starting to reject this
4. Microsoft Purview basic DLP -- cloud-dependent, not CMMC-specific
5. Wait for Microsoft to fix it natively

The real enemy is inertia. The behavior to replace: "we wrote a policy and called it a control."
C3PAOs are now specifically asking for evidence, not policy documents.
This is the forcing function that converts inertia into purchase intent.`,
      ["workaround", "dns", "block", "policy", "purview", "inertia", "behavior", "c3pao"]
    ),
  ];
}
