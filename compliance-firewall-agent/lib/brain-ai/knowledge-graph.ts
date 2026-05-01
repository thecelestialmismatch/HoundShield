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
// Singleton export + convenience wrappers
// ---------------------------------------------------------------------------

let _graph: KnowledgeGraph | null = null;

export function getKnowledgeGraph(): KnowledgeGraph {
  if (!_graph) _graph = new KnowledgeGraph();
  return _graph;
}

export async function queryKnowledgeGraph(params: KnowledgeQuery): Promise<KnowledgeResult[]> {
  return getKnowledgeGraph().query(params);
}

export function addKnowledgeNode(node: KnowledgeNode): void {
  const graph = getKnowledgeGraph();
  (graph as unknown as { nodes: Map<string, KnowledgeNode> }).nodes.set(node.id, node);
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

    // ---- NIST 800-171 Rev 2 Domain Summaries ----
    // Source: NIST SP 800-171 Rev 2 (permanent, ttl: 0, confidence: 1.0)
    // csrc.nist.gov/publications/detail/sp/800-171/rev-2/final
    Object.assign(node(
      "nist_ac",
      "nist",
      "NIST 800-171 Rev 2 — Access Control (AC) Domain",
      `Domain: Access Control (AC). Controls: 3.1.1 through 3.1.22. Count: 22 controls.
SPRS deduction if failed: significant — AC family is heavily weighted.
Key controls for AI tool governance:
3.1.3: Control the flow of CUI in accordance with approved authorizations — AI tools sending CUI externally violates this.
3.1.11: Terminate sessions after a defined period of inactivity.
3.1.13: Employ cryptographic mechanisms to protect the confidentiality of remote access sessions.
HoundShield directly addresses: 3.1.3, 3.1.1, 3.1.2 by proxying and controlling AI-bound traffic.`,
      ["access control", "ac", "3.1", "cui flow", "authorization", "session", "remote access"]
    ), { source: "NIST SP 800-171 Rev 2", sourceType: "static", weight: 1.0, ttl: 0 }),

    Object.assign(node(
      "nist_at",
      "nist",
      "NIST 800-171 Rev 2 — Awareness and Training (AT) Domain",
      `Domain: Awareness and Training (AT). Controls: 3.2.1 through 3.2.3. Count: 3 controls.
3.2.1: Ensure personnel are aware of security risks associated with CUI.
3.2.2: Ensure personnel are trained to carry out assigned security responsibilities.
3.2.3: Provide security awareness training on recognizing and reporting threats.
HoundShield supports AT by generating reports that demonstrate employee training records are backed by technical enforcement — not just policy acknowledgements.`,
      ["awareness", "training", "at", "3.2", "personnel", "security risk", "cui awareness"]
    ), { source: "NIST SP 800-171 Rev 2", sourceType: "static", weight: 1.0, ttl: 0 }),

    Object.assign(node(
      "nist_au",
      "nist",
      "NIST 800-171 Rev 2 — Audit and Accountability (AU) Domain",
      `Domain: Audit and Accountability (AU). Controls: 3.3.1 through 3.3.9. Count: 9 controls.
3.3.1: Create and retain system audit logs — the PDF audit report is the primary evidence artifact.
3.3.2: Ensure the actions of individual users can be traced to those users — per-user logging.
3.3.7: Provide a system capability to compare and synchronize internal clocks.
HoundShield directly addresses: 3.3.1 and 3.3.2 with per-user, per-request immutable audit log (SHA-256 chain).
The PDF export maps each logged event to the relevant AU control.`,
      ["audit", "accountability", "au", "3.3", "log", "retain", "trace", "user", "sha256", "immutable"]
    ), { source: "NIST SP 800-171 Rev 2", sourceType: "static", weight: 1.0, ttl: 0 }),

    Object.assign(node(
      "nist_cm",
      "nist",
      "NIST 800-171 Rev 2 — Configuration Management (CM) Domain",
      `Domain: Configuration Management (CM). Controls: 3.4.1 through 3.4.9. Count: 9 controls.
3.4.6: Employ the principle of least functionality — restrict use of unauthorized AI tools.
3.4.7: Restrict, disable, or prevent the use of nonessential programs and functions.
3.4.8: Apply deny-by-exception policy to prevent unauthorized software use.
HoundShield supports CM by providing a configurable allowlist of approved AI endpoints — unrecognized AI providers are blocked by default.`,
      ["configuration", "cm", "3.4", "least functionality", "restrict", "allowlist", "deny", "software"]
    ), { source: "NIST SP 800-171 Rev 2", sourceType: "static", weight: 1.0, ttl: 0 }),

    Object.assign(node(
      "nist_ia",
      "nist",
      "NIST 800-171 Rev 2 — Identification and Authentication (IA) Domain",
      `Domain: Identification and Authentication (IA). Controls: 3.5.1 through 3.5.11. Count: 11 controls.
3.5.3: Use multifactor authentication for local and network access to privileged accounts.
3.5.10: Store and transmit only cryptographically-protected passwords.
3.5.11: Obscure feedback of authentication information during authentication process.
HoundShield integration: proxy enforces authenticated sessions before forwarding to AI providers.`,
      ["identification", "authentication", "ia", "3.5", "mfa", "multifactor", "password", "credential"]
    ), { source: "NIST SP 800-171 Rev 2", sourceType: "static", weight: 1.0, ttl: 0 }),

    Object.assign(node(
      "nist_ir",
      "nist",
      "NIST 800-171 Rev 2 — Incident Response (IR) Domain",
      `Domain: Incident Response (IR). Controls: 3.6.1 through 3.6.3. Count: 3 controls.
3.6.1: Establish an incident-handling capability that includes preparation, detection, analysis, containment, recovery, and user response activities.
3.6.2: Track, document, and report incidents to officials within the organization and appropriate authorities.
3.6.3: Test the incident response capability.
HoundShield supports IR: when a CUI spill via AI is detected, it generates an incident record that feeds directly into the 3.6.2 reporting requirement.`,
      ["incident", "response", "ir", "3.6", "detection", "containment", "reporting", "track"]
    ), { source: "NIST SP 800-171 Rev 2", sourceType: "static", weight: 1.0, ttl: 0 }),

    Object.assign(node(
      "nist_ma",
      "nist",
      "NIST 800-171 Rev 2 — Maintenance (MA) Domain",
      `Domain: Maintenance (MA). Controls: 3.7.1 through 3.7.6. Count: 6 controls.
3.7.1: Perform maintenance on organizational systems.
3.7.5: Require MFA to establish remote maintenance sessions.
HoundShield: Docker deployment enables easy maintenance without downtime — update container, restart. No CUI leaves the network during updates.`,
      ["maintenance", "ma", "3.7", "remote", "update", "docker", "downtime"]
    ), { source: "NIST SP 800-171 Rev 2", sourceType: "static", weight: 1.0, ttl: 0 }),

    Object.assign(node(
      "nist_mp",
      "nist",
      "NIST 800-171 Rev 2 — Media Protection (MP) Domain",
      `Domain: Media Protection (MP). Controls: 3.8.1 through 3.8.9. Count: 9 controls.
3.8.1: Protect (i.e., physically control and securely store) CUI in paper and digital form.
3.8.3: Sanitize or destroy information system media before disposal.
3.8.7: Control the use of removable media.
HoundShield context: AI prompts containing CUI are a form of uncontrolled media transfer. Blocking them satisfies 3.8.1 intent.`,
      ["media", "protection", "mp", "3.8", "sanitize", "removable", "disposal", "cui storage"]
    ), { source: "NIST SP 800-171 Rev 2", sourceType: "static", weight: 1.0, ttl: 0 }),

    Object.assign(node(
      "nist_pe",
      "nist",
      "NIST 800-171 Rev 2 — Personnel Security (PS) Domain",
      `Domain: Personnel Security (PS). Controls: 3.9.1 through 3.9.2. Count: 2 controls.
3.9.1: Screen individuals prior to authorizing access to organizational systems.
3.9.2: Ensure CUI is protected during and after personnel actions such as terminations.
HoundShield: user-level audit logs support 3.9.2 — when an employee is terminated, logs show their AI usage history.`,
      ["personnel", "security", "ps", "3.9", "screening", "termination", "offboarding"]
    ), { source: "NIST SP 800-171 Rev 2", sourceType: "static", weight: 1.0, ttl: 0 }),

    Object.assign(node(
      "nist_ra",
      "nist",
      "NIST 800-171 Rev 2 — Risk Assessment (RA) Domain",
      `Domain: Risk Assessment (RA). Controls: 3.11.1 through 3.11.3. Count: 3 controls.
3.11.1: Periodically assess risk to organizational operations, assets, individuals, and other organizations resulting from CUI processing.
3.11.2: Scan for vulnerabilities in organizational systems periodically.
3.11.3: Remediate vulnerabilities per risk assessments.
HoundShield supports: scan history + blocked query analytics show AI risk surface over time.`,
      ["risk", "assessment", "ra", "3.11", "vulnerability", "scan", "remediate", "periodic"]
    ), { source: "NIST SP 800-171 Rev 2", sourceType: "static", weight: 1.0, ttl: 0 }),

    Object.assign(node(
      "nist_ca",
      "nist",
      "NIST 800-171 Rev 2 — Security Assessment (CA) Domain",
      `Domain: Security Assessment (CA). Controls: 3.12.1 through 3.12.4. Count: 4 controls.
3.12.1: Periodically assess security controls to determine effectiveness.
3.12.2: Develop and implement plans of action to correct deficiencies.
3.12.4: Develop, document, and periodically update a system security plan (SSP).
HoundShield: the audit PDF serves as evidence of ongoing CA-level monitoring and SSP documentation.`,
      ["security assessment", "ca", "3.12", "ssp", "plan of action", "poam", "deficiency", "sssp"]
    ), { source: "NIST SP 800-171 Rev 2", sourceType: "static", weight: 1.0, ttl: 0 }),

    Object.assign(node(
      "nist_sc",
      "nist",
      "NIST 800-171 Rev 2 — System and Communications Protection (SC) Domain",
      `Domain: System and Communications Protection (SC). Controls: 3.13.1 through 3.13.16. Count: 16 controls.
3.13.2: Employ architectural designs, software development techniques, and systems engineering principles promoting security in organizational systems.
3.13.8: Implement cryptographic mechanisms to prevent unauthorized disclosure of CUI.
3.13.16: Protect the confidentiality of CUI at rest.
HoundShield: proxy enforces encrypted connections to AI providers (TLS). Audit logs encrypted at rest in Supabase.`,
      ["system", "communications", "sc", "3.13", "encryption", "tls", "cryptographic", "architectural"]
    ), { source: "NIST SP 800-171 Rev 2", sourceType: "static", weight: 1.0, ttl: 0 }),

    Object.assign(node(
      "nist_si",
      "nist",
      "NIST 800-171 Rev 2 — System and Information Integrity (SI) Domain",
      `Domain: System and Information Integrity (SI). Controls: 3.14.1 through 3.14.7. Count: 7 controls.
3.14.1: Identify, report, and correct information system flaws in a timely manner.
3.14.6: Monitor organizational systems to detect attacks and indicators of potential attacks.
3.14.7: Identify unauthorized use of organizational systems.
HoundShield directly addresses: 3.14.6 (real-time CUI detection = attack indicator monitoring) and 3.14.7 (unauthorized AI tool use detection).`,
      ["system integrity", "si", "3.14", "flaw", "monitor", "detect", "attack", "unauthorized"]
    ), { source: "NIST SP 800-171 Rev 2", sourceType: "static", weight: 1.0, ttl: 0 }),

    // ---- Additional competitor nodes ----
    node(
      "competitor_cloudflare_ai_gw",
      "competitor",
      "Cloudflare AI Gateway — free tier threat",
      `Cloudflare AI Gateway is a free AI proxy product.
Architecture: cloud-based (Cloudflare edge network). CUI leaves the customer network.
CMMC compliance: NOT compliant — all traffic processed by Cloudflare's infrastructure.
Strengths: free, easy setup, Cloudflare's distribution network, developer-friendly.
Weaknesses: cloud-only, no CMMC patterns, no PDF audit report, no on-premise option.
Threat: free tier creates "why pay?" objection. Response: free tier has no CMMC evidence package.
HoundShield advantage: C3PAO-ready PDF, CMMC-specific detection patterns, local processing.`,
      ["cloudflare", "ai gateway", "free", "edge", "competitor", "proxy"]
    ),

    node(
      "competitor_forcepoint",
      "competitor",
      "Forcepoint DLP — enterprise on-premise (indirect competitor)",
      `Forcepoint DLP is an enterprise data loss prevention platform with on-premise option.
Architecture: on-premise available, but complex deployment (months, not minutes).
CMMC compliance: can be configured for CMMC but requires specialized integrators.
Pricing: $100K+ implementation + $50K+/yr. Out of reach for 50-250 person contractors.
Strengths: established brand, true on-premise, government sector experience.
Weaknesses: not AI-native, no ChatGPT/Copilot specific patterns, no C3PAO PDF, months to deploy.
HoundShield advantage: AI-native, Docker deploy in 15 minutes, 1/10th the price.`,
      ["forcepoint", "enterprise", "on-premise", "dlp", "competitor", "government"]
    ),

    // ---- Market nodes ----
    node(
      "market_open_source",
      "market",
      "Open-source distribution strategy (Cal.com / Supabase model)",
      `Open-source core → paid cloud: proven model for developer-focused compliance tools.
Examples: Supabase ($80M ARR), PostHog (50K self-hosted installs → 3% paid cloud conversion), Cal.com (40K GitHub stars → enterprise sales).
HoundShield open-source: proxy engine + scanner + 16 CMMC patterns (MIT licensed on GitHub).
HoundShield paid cloud: dashboard + Brain AI + compliance reports + Stripe + Supabase managed.
Why it works for HoundShield: defense contractors want to audit the code before trusting it with CUI. Open source IS the trust signal for security products.
GitHub discoverability: "CMMC AI scanner" search → HoundShield → install → upgrade to paid dashboard.
Expected conversion: 1-3% of self-hosted users upgrade to paid within 6 months.`,
      ["open source", "github", "cal.com", "supabase", "posthog", "distribution", "self-hosted", "mit"]
    ),

    node(
      "market_yc",
      "market",
      "YC application strategy and traction requirements",
      `YC S26 application window: approx March-April 2026. Deadline: early April 2026.
Traction needed for acceptance: $5K-$15K MRR or 10+ paying customers preferred.
Our target: $10K MRR by October 2026 (YC W27 if S26 missed).
YC fit: B2B SaaS, compliance tech, defense contractor market, clear regulatory forcing function.
Comparable YC companies: Vanta (SOC 2 automation), Drata (compliance), Andesite (defense).
What to emphasize in application: local-only architecture moat, CMMC legal requirement (not just feature), C3PAO as distribution channel.`,
      ["yc", "y combinator", "s26", "w27", "traction", "application", "mrr", "b2b", "saas"]
    ),

    node(
      "market_pricing_psychology",
      "pricing",
      "Pricing psychology for CMMC compliance buyers",
      `Reference points Jordan uses to evaluate $199-$499/mo:
- C3PAO assessment fee: $30K-$150K (one-time). HoundShield: $2.4K-$6K/yr = <5% of assessment cost.
- DFARS violation: potential contract loss ($500K-$50M contract at risk). HoundShield: rounding error.
- One hour of compliance attorney time: $300-$600. HoundShield monthly = 1 attorney hour.
- Nightfall: $75K+/yr. HoundShield: $2.4K-$6K/yr. 10-30x cheaper.
Framing that works: "It costs less than one attorney consultation and gives you the PDF your C3PAO assessor needs."
Do NOT compete on features. Compete on evidence. Audit PDF = the purchase justification.`,
      ["pricing", "value", "reference point", "c3pao", "attorney", "comparison", "justification", "199", "499"]
    ),

    // ---- Security nodes ----
    node(
      "security_owasp_api",
      "nist",
      "OWASP API Security Top 10 — checklist for HoundShield endpoints",
      `OWASP API Security Top 10 (2023) applied to HoundShield:
API1: Broken Object Level Authorization — each user can only see their own scan logs.
API2: Broken Authentication — all API routes require valid Supabase session.
API3: Broken Object Property Level Authorization — PDF download requires Growth tier check.
API4: Unrestricted Resource Consumption — rate limiting on /api/scan/* (100 req/min per tenant).
API5: Broken Function Level Authorization — admin routes require service role key.
API6: Unrestricted Access to Sensitive Business Flows — scan API requires license validation.
API7: Server Side Request Forgery — proxy validates destination URL against allowlist.
API8: Security Misconfiguration — CORS restricted to houndshield.com origin.
API9: Improper Inventory Management — all routes documented in api.md.
API10: Unsafe Consumption of APIs — all AI provider responses validated before forwarding.`,
      ["owasp", "api", "security", "top 10", "authorization", "authentication", "rate limit", "cors"]
    ),

    node(
      "security_threat_model",
      "architecture",
      "HoundShield threat model — top attack vectors",
      `Primary threats ranked by likelihood × impact:
1. API key theft via scan response exfiltration — CRITICAL. Mitigated: patterns strip keys before forwarding.
2. Bypass via direct AI provider URL — HIGH. Mitigated: firewall rule blocks direct traffic, enforces proxy.
3. Audit log tampering — HIGH. Mitigated: SHA-256 hash chain, immutable Supabase rows.
4. License key spoofing — MEDIUM. Mitigated: license validated server-side, never client-only.
5. SSRF via proxy target — MEDIUM. Mitigated: allowlist of approved AI endpoints.
6. Tenant data leakage — MEDIUM. Mitigated: RLS policies on all Supabase tables.
NIST controls addressed: 3.13.8 (cryptographic protection), 3.14.6 (attack monitoring), 3.1.3 (CUI flow control).`,
      ["threat model", "attack", "bypass", "ssrf", "tenant isolation", "rls", "sha256", "api key"]
    ),

    // ---- Product Roadmap ----
    node(
      "product_roadmap",
      "architecture",
      "HoundShield product roadmap — next capability layer",
      `Planned features in priority order:
1. Shannon entropy engine — detects API keys, tokens, secrets via statistical analysis. Shannon entropy H > 3.5 for strings >16 chars = likely secret/key. Complements the 16 regex patterns for secrets with no known format.
2. Paste interception (browser extension) — intercepts clipboard paste events before text reaches the AI chat UI. Safe redact mode: strips detected CUI inline, lets clean text through. Target browsers: Chrome, Edge.
3. Extended AI provider support — Perplexity, Grok, Mistral, Meta AI (Llama.ai) added as recognized proxy targets. Current coverage: ChatGPT, Copilot, Claude, OpenAI API.
4. Demo mode guard — full compliance dashboard accessible without Supabase/Stripe credentials. Jordan can evaluate before committing.
5. Subscription gating validation — Free/Pro/Growth/Enterprise tiers enforced at feature level (currently partial).`,
      ["roadmap", "entropy", "extension", "paste", "perplexity", "grok", "mistral", "meta", "demo", "tier"]
    ),

    node(
      "product_extension",
      "architecture",
      "Browser extension — paste interception and safe redact mode",
      `Complementary deployment path to the network proxy. Proxy intercepts at network layer (all AI traffic). Extension intercepts at UI layer (paste events in AI chat windows).
Architecture: content script listens for paste events on known AI chat URLs. Runs the same 16-pattern scanner locally via WASM. Safe redact mode: replaces detected PII/CUI with tokens like [REDACTED-SSN], [REDACTED-CUI], and lets the user paste clean text.
Use case: contractors who cannot change network proxy (BYOD, home office). Extension is the fallback deployment path that requires zero IT involvement.
Supported sites planned: chat.openai.com, copilot.microsoft.com, claude.ai, perplexity.ai, grok.x.ai, mistral.ai.
Deployment: publish to Chrome Web Store and Microsoft Edge Add-ons. MDM-deployable for enterprise.`,
      ["extension", "chrome", "edge", "paste", "clipboard", "wasm", "redact", "content-script", "byod"]
    ),

    node(
      "product_entropy",
      "architecture",
      "Shannon entropy engine — statistical secret and API key detection",
      `API keys and secrets have high entropy (near-random character distribution). Shannon entropy: H = -sum(p_i * log2(p_i)) where p_i is probability of character i in the string.
Detection threshold: H > 3.5 for strings longer than 16 characters = probable secret/key.
Implementation: sliding window scan over prompt tokens. Flags strings resembling API keys (sk-proj-xxx, ghp_xxx, AKIA-xxx), JWTs (three base64 segments separated by dots), private keys (PEM headers), and database connection strings.
Why this matters: regex patterns require knowing the key format in advance. Entropy catches zero-day API key formats and novel secret structures the 16-pattern set has never seen.
NIST 800-171 control: 3.13.10 — Employ FIPS-validated cryptography. Preventing key material from leaving the network satisfies this control.`,
      ["entropy", "shannon", "api-key", "secret", "token", "jwt", "private-key", "detection", "zero-day"]
    ),

    node(
      "product_sprint1_mvp",
      "customer",
      "Sprint 1 MVP — Jordan's 10-minute deploy and PDF flow",
      `Sprint 1 goal: Jordan deploys HoundShield in under 10 minutes and exports a PDF she can hand to her C3PAO assessor.
Required flow end-to-end:
1. Visit houndshield.com → sign up (Stripe Free tier)
2. Dashboard shows Docker pull command: docker pull houndshield/proxy:latest
3. Set one environment variable: OPENAI_API_KEY=<her-key>
4. docker run -p 8080:8080 houndshield/proxy — proxy is running
5. Change ChatGPT proxy URL to http://localhost:8080
6. Send 3 test prompts: one with SSN, one with CUI phrase, one clean
7. Dashboard shows 3 events: 2 blocked, 1 allowed
8. Click "Export PDF" — C3PAO-ready audit report downloads
Total time target: under 10 minutes for a non-technical IT manager.
PDF contents: timestamped event log, NIST 800-171 control mapping (AC.L2-3.1.3, AU.L2-3.3.1, SI.L2-3.14.6), SPRS score improvement estimate (+15 to +30 points).`,
      ["jordan", "sprint", "mvp", "docker", "deploy", "pdf", "c3pao", "10-minutes", "flow", "onboarding"]
    ),

    node(
      "market_customer_discovery",
      "customer",
      "Customer discovery framework — 5 validated open-ended questions",
      `Five questions that reveal truth without leading the witness. Open-ended — no yes/no answers.
1. "Walk me through what happens when one of your engineers pastes something into ChatGPT today — who knows about it, who doesn't?"
2. "When your C3PAO assessor asks about AI tool controls, what do you currently show them?"
3. "How many people in your org use ChatGPT or Copilot? How many are supposed to?"
4. "What would happen if a CUI document was pasted into ChatGPT by mistake — would anyone know?"
5. "If you could prove to your C3PAO that no CUI ever reached an external AI server, what would that be worth to your next assessment?"
Validation signals that prove urgency and purchase intent:
- Jordan says "I have no answer for my C3PAO" (immediate pain)
- Engineers admit using personal hotspots to bypass DNS block (policy is already failing)
- C3PAO pre-assessment is booked within 90 days (deadline urgency)
- Prime contractor has issued a mandate (external forcing function)`,
      ["discovery", "questions", "c3pao", "validation", "jordan", "chatgpt", "signals", "urgency", "interview"]
    ),

    node(
      "market_ooda_verdict",
      "market",
      "OODA Phase 1-5 analysis verdict — BUILD",
      `Paul Graham-style pressure test results (OODA analysis, April 2026):
Core testable hypothesis: DoD contractors pay $199-$499/month for local-only AI DLP that produces C3PAO audit evidence.
Verdict: STRONG. Paul Graham would fund this in current form.
Reasons:
- Forcing function is federal law (DFARS 7012), not a preference. Enforcement date: November 2026.
- Architecture moat: local-only cannot be copied without rebuilding competitors' entire cloud stack.
- Distribution: C3PAO channel gives multiplied reach (each C3PAO = 10-50 contractor clients).
- Painkiller, not vitamin: CMMC failure = potential contract loss on renewal ($500K-$50M contracts at risk).
Top three failure modes ranked by severity:
1. Enterprise DLP vendor (Microsoft, Broadcom) ships local CMMC-specific AI scanning before Nov 2026.
2. Microsoft GCC High adds local AI prompt scanning to Copilot before enforcement date.
3. CMMC enforcement deadline pushed again — removes urgency.
Founder-market fit: STRONG. Deep proxy architecture knowledge + compliance regulatory depth.`,
      ["ooda", "paul-graham", "verdict", "build", "failure-modes", "painkiller", "yc", "dfars", "enforcement"]
    ),

    node(
      "product_evolution",
      "market",
      "Product evolution — Kaelus to HoundShield rebranding rationale",
      `Original name: Kaelus.Online (Greek root, abstract). Renamed to HoundShield (April 2026).
Strategic rationale:
1. "Kaelus" has no meaning in the target buyer's vocabulary. "HoundShield" signals watchdog (hound = surveillance/tracking) + protection (shield). Jordan understands it without explanation.
2. Domain houndshield.com acquired. All configs updated: Vercel project renamed, GitHub repo repointed.
3. Messaging pivot: "AI compliance firewall" became "Local-only AI DLP for CMMC." CMMC-first positioning reduces scope and sharpens the beachhead.
4. Code: 295 files renamed, all source code references updated from Kaelus to HoundShield.
Pending production tasks (blockers):
- Stripe webhook still points to kaelus.online — must update at dashboard.stripe.com/webhooks to https://houndshield.com/api/stripe/webhook. This blocks all paid subscription completions.
- Supabase migrations 003 and 004 not pushed to production DB — run: cd compliance-firewall-agent && npx supabase db push`,
      ["rebrand", "kaelus", "houndshield", "stripe", "webhook", "migration", "open-source", "blocker"]
    ),

    node(
      "tool_ecosystem",
      "architecture",
      "Developer tooling ecosystem — tools used to build HoundShield",
      `Key tools integrated into the HoundShield development workflow:
- Firecrawl: web scraping for Brain AI knowledge ingestion. Wired in lib/brain-ai/firecrawl-updater.ts. Fetches competitor pages, NIST docs, regulatory updates.
- Context7: injects up-to-date, version-specific library docs into Claude Code sessions. Prevents hallucinated APIs.
- claude-mem / episodic-memory MCP: persistent memory across Claude Code sessions. Stores decisions, preferences, lessons learned.
- browser-harness / browser-use: browser automation for testing AI provider proxy integrations end-to-end.
- code-review-graph MCP: tree-sitter codebase graph + BM25 impact analysis. Run before lib/gateway/ changes to get impact radius. 6.8x token reduction vs full traversal.
- Superpowers plugin (obra/superpowers): enforces brainstorming → TDD → code review workflow in every session.
- GSD (Get Shit Done): spec-driven development — interviews user, builds plan, executes phase by phase with verification gates.
- caveman mode: token-efficient response protocol for dense sessions. Drops filler, keeps technical substance.`,
      ["firecrawl", "context7", "browser-use", "gsd", "superpowers", "tooling", "workflow", "mcp", "caveman"]
    ),
  ];
}
