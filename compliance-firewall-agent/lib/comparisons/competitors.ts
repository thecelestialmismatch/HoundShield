/**
 * Competitor comparison data — the source of truth for /compare and /compare/[slug].
 *
 * Editorial rules (enforced by lib/comparisons/__tests__/competitors.test.ts):
 *  - Every claim is architectural or publicly verifiable. No invented metrics.
 *  - Competitor strengths are stated honestly (credibility > spin).
 *  - The single durable differentiator is architecture: HoundShield scans LOCALLY
 *    (Mode B / self-hosted Docker), so prompt content never leaves the customer
 *    boundary. Every listed competitor routes prompt content to their cloud to
 *    scan it — itself a potential DFARS 7012 / HIPAA exposure for regulated data.
 *  - The CUI-safe claim holds ONLY in Mode B. Never imply the hosted trial is CUI-safe.
 */

export type Advantage = "houndshield" | "competitor" | "even";

export interface MatrixRow {
  dimension: string;
  houndshield: string;
  competitor: string;
  /** Who wins this row for a regulated-industry buyer. */
  advantage: Advantage;
}

export interface ComparisonFaq {
  q: string;
  a: string;
}

export interface EdgePoint {
  title: string;
  body: string;
}

export interface Comparison {
  slug: string;
  /** Full product name as marketed. */
  competitor: string;
  /** Short label for tables/badges. */
  competitorShort: string;
  /** How we categorize their architecture, e.g. "Cloud-routed AI DLP". */
  category: string;
  /** Hero subline. */
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  /** BLUF: one honest sentence a buyer can quote. */
  summary: string;
  /** Neutral description of what they actually do. */
  theirApproach: string;
  /** Honest credit — the reasons a buyer might legitimately pick them. */
  theirStrengths: string[];
  /** Concrete HoundShield differentiators for the regulated buyer. */
  ourEdge: EdgePoint[];
  matrix: MatrixRow[];
  /** Which buyer persona this comparison matters most for. */
  buyerFit: string;
  /** Honest "pick them when…" — builds trust, not every deal is ours. */
  chooseThemWhen: string[];
  chooseUsWhen: string[];
  faqs: ComparisonFaq[];
  /** ISO date of last fact review. */
  updated: string;
}

const UPDATED = "2026-07-04";

export const COMPARISONS: Comparison[] = [
  {
    slug: "nightfall",
    competitor: "Nightfall AI",
    competitorShort: "Nightfall",
    category: "Cloud-routed AI DLP",
    tagline:
      "Nightfall scans your ChatGPT prompts in Nightfall's cloud. HoundShield scans them inside your network — nothing leaves the boundary.",
    metaTitle: "HoundShield vs Nightfall AI — Local vs Cloud-Routed AI DLP (2026)",
    metaDescription:
      "An honest HoundShield vs Nightfall AI comparison for CMMC and HIPAA teams. Nightfall routes prompt content to its cloud to scan it; HoundShield scans locally (Mode B) so CUI/PHI never leaves your network, and ships a $499 NIST 800-171 evidence PDF.",
    summary:
      "Nightfall is a mature, ML-driven cloud DLP with strong PII/PHI classifiers — but its ChatGPT protection runs as a browser plugin that sends prompt content to Nightfall's cloud to be scanned. For a defense or healthcare buyer, that transit is itself the exposure you're trying to eliminate.",
    theirApproach:
      "Nightfall is an AI-native, API-first cloud DLP with 100+ ML detection models. It protects ChatGPT via a Chrome browser plugin and integrates with SaaS apps (Slack, Salesforce, etc.). Detection happens in Nightfall's cloud; content is transmitted there to be classified and redacted.",
    theirStrengths: [
      "Mature, well-reviewed ML classifiers with high recall on PII/PHI",
      "Broad SaaS coverage beyond AI (Slack, Jira, Salesforce, GitHub)",
      "Fast browser-plugin rollout with no infrastructure to run",
      "Session differentiation (corporate vs personal) added in 2026",
    ],
    ourEdge: [
      {
        title: "Local scan — content never leaves your network",
        body: "In Mode B (self-hosted Docker) HoundShield inspects every prompt on your own infrastructure in <10ms. Nightfall transmits prompt content to its cloud to scan it — for CUI or PHI, that transit can itself be the spill under DFARS 7012 / HIPAA.",
      },
      {
        title: "A C3PAO-ready evidence artifact, not just blocking",
        body: "HoundShield generates a $499 one-time CMMC AI Risk Assessment PDF mapped to NIST 800-171 Rev 2 — the evidence an assessor accepts. Nightfall gives you dashboards and alerts, not a control-mapped assessment report.",
      },
      {
        title: "Any AI tool, one proxy",
        body: "One drop-in OpenAI-compatible proxy covers ChatGPT, Copilot, Claude and any OpenAI-compatible endpoint — not a per-app browser plugin.",
      },
      {
        title: "Air-gapped option (Mode C)",
        body: "For IL-5+ and isolated networks, HoundShield runs fully offline. A cloud-native DLP cannot.",
      },
    ],
    matrix: [
      { dimension: "Where prompts are scanned", houndshield: "Locally, inside your network (Mode B/C)", competitor: "In Nightfall's cloud", advantage: "houndshield" },
      { dimension: "CUI leaves your boundary?", houndshield: "No", competitor: "Yes — sent to their cloud to scan", advantage: "houndshield" },
      { dimension: "CMMC / NIST 800-171 evidence PDF", houndshield: "$499 one-time report, control-mapped", competitor: "Not a deliverable", advantage: "houndshield" },
      { dimension: "AI tools covered", houndshield: "Any OpenAI-compatible endpoint via proxy", competitor: "ChatGPT via Chrome plugin + SaaS apps", advantage: "even" },
      { dimension: "Air-gapped deployment", houndshield: "Yes (Mode C)", competitor: "No (cloud-native)", advantage: "houndshield" },
      { dimension: "ML classifier breadth", houndshield: "16 deterministic engines", competitor: "100+ ML models", advantage: "competitor" },
      { dimension: "Pricing model", houndshield: "$499 report + per-org plans", competitor: "Usage-tiered, enterprise-quoted", advantage: "houndshield" },
    ],
    buyerFit:
      "Defense subcontractors (Jordan) and healthcare privacy officers (Rachel) who cannot let regulated data transit a third-party cloud.",
    chooseThemWhen: [
      "You want the broadest cloud SaaS DLP coverage and your data is not CUI/regulated in a way that bars cloud transit",
      "You prefer zero infrastructure and are comfortable with cloud-based inspection",
    ],
    chooseUsWhen: [
      "You handle CUI, PHI, or ITAR and cannot send prompt content to a vendor cloud",
      "You need a control-mapped assessment PDF for a C3PAO or auditor",
      "You need an air-gapped or fully on-prem deployment",
    ],
    faqs: [
      {
        q: "Does Nightfall send my ChatGPT prompts to its cloud?",
        a: "Yes. Nightfall's detection models run in Nightfall's cloud, so prompt content is transmitted there to be scanned and redacted. HoundShield's Mode B scans locally, so prompt content never leaves your network.",
      },
      {
        q: "Does Nightfall produce a CMMC or NIST 800-171 report?",
        a: "Nightfall provides DLP dashboards and alerts, not a control-mapped CMMC AI Risk Assessment. HoundShield's $499 report maps AI prompt events to NIST 800-171 Rev 2 controls for assessor evidence.",
      },
    ],
    updated: UPDATED,
  },
  {
    slug: "prompt-security",
    competitor: "Prompt Security (SentinelOne)",
    competitorShort: "Prompt Security",
    category: "Cloud-routed AI gateway",
    tagline:
      "Prompt Security inspects AI traffic in its cloud, priced per seat. HoundShield inspects locally, priced per organization.",
    metaTitle: "HoundShield vs Prompt Security (SentinelOne) — AI Firewall Comparison",
    metaDescription:
      "HoundShield vs Prompt Security for CMMC/HIPAA teams. Prompt Security is a cloud-routed, per-seat AI gateway now owned by SentinelOne; HoundShield scans locally (Mode B) so CUI/PHI stays on-prem, with a $499 NIST 800-171 evidence PDF and per-org pricing.",
    summary:
      "Prompt Security is a capable enterprise AI gateway — now part of SentinelOne — that inspects LLM traffic through the browser and a cloud service. It scales per seat and routes inspection through its cloud, which reintroduces the same SC.3.177 transit problem for regulated data.",
    theirApproach:
      "Prompt Security sits between employees and AI apps (browser extension + proxy), inspecting prompts and responses for sensitive data, prompt injection, and shadow-AI usage. Inspection is delivered as a cloud service. Following the SentinelOne acquisition it is positioned inside a broader enterprise security suite.",
    theirStrengths: [
      "Strong prompt-injection and shadow-AI discovery, not just DLP",
      "Enterprise backing and integration with SentinelOne's platform",
      "Broad LLM-app coverage across the browser",
      "Good fit for large enterprises already standardized on SentinelOne",
    ],
    ourEdge: [
      {
        title: "Local inspection, not cloud-routed",
        body: "HoundShield Mode B keeps prompt content on your infrastructure. Prompt Security delivers inspection as a cloud service — for CUI that transit is the exposure.",
      },
      {
        title: "Per-organization, not per-seat",
        body: "Per-seat AI-gateway pricing scales painfully for a 50–500 person contractor. HoundShield leads with a $499 one-time report and per-org plans.",
      },
      {
        title: "Purpose-built CMMC evidence",
        body: "HoundShield's report is mapped to NIST 800-171 Rev 2 and formatted for a C3PAO. A general enterprise AI gateway is not a CMMC deliverable.",
      },
      {
        title: "SMB and air-gap reach",
        body: "Below the enterprise threshold and inside isolated networks, HoundShield deploys where a cloud enterprise suite won't.",
      },
    ],
    matrix: [
      { dimension: "Where prompts are scanned", houndshield: "Locally (Mode B/C)", competitor: "Cloud service", advantage: "houndshield" },
      { dimension: "Pricing model", houndshield: "$499 report + per-org plans", competitor: "Per-seat, enterprise-quoted", advantage: "houndshield" },
      { dimension: "Prompt-injection / shadow-AI detection", houndshield: "Prompt scanning + audit; injection on roadmap", competitor: "Mature", advantage: "competitor" },
      { dimension: "CMMC / NIST 800-171 evidence PDF", houndshield: "$499 one-time, control-mapped", competitor: "Not a deliverable", advantage: "houndshield" },
      { dimension: "Air-gapped deployment", houndshield: "Yes (Mode C)", competitor: "No", advantage: "houndshield" },
      { dimension: "Best-fit org size", houndshield: "50–500 employees, regulated", competitor: "Large enterprise", advantage: "even" },
    ],
    buyerFit:
      "Sub-500-employee defense and legal firms (Jordan, Marcus) that need CMMC evidence without enterprise per-seat pricing or cloud inspection.",
    chooseThemWhen: [
      "You're a large enterprise already standardized on SentinelOne",
      "Advanced prompt-injection defense across many LLM apps is your primary need",
    ],
    chooseUsWhen: [
      "You need CUI/PHI inspected locally, never cloud-routed",
      "Per-seat pricing doesn't fit a 50–500 person org",
      "You need a C3PAO-ready assessment PDF, not just a gateway",
    ],
    faqs: [
      {
        q: "Is Prompt Security on-premise?",
        a: "Prompt Security delivers inspection as a cloud service. HoundShield's Mode B runs on your own Docker infrastructure so prompt content never leaves your network.",
      },
      {
        q: "How is HoundShield priced versus Prompt Security?",
        a: "HoundShield leads with a $499 one-time CMMC AI Risk Assessment and per-organization plans. Prompt Security is an enterprise-quoted, per-seat AI gateway.",
      },
    ],
    updated: UPDATED,
  },
  {
    slug: "microsoft-purview-gcc-high",
    competitor: "Microsoft Purview + GCC High Copilot",
    competitorShort: "Purview / GCC High",
    category: "Microsoft-only governance",
    tagline:
      "Purview governs Copilot inside GCC High. It does not stop an employee pasting CUI into ChatGPT in a browser. HoundShield does.",
    metaTitle: "HoundShield vs Microsoft Purview + GCC High Copilot for CMMC (2026)",
    metaDescription:
      "HoundShield vs Microsoft Purview and GCC High Copilot. Purview governs Microsoft Copilot inside a GCC High tenant (E5 + costly migration); it doesn't cover ChatGPT/Claude/Gemini in the browser. HoundShield scans any AI tool locally with a $499 NIST 800-171 evidence PDF — no GCC High migration.",
    summary:
      "If your organization is fully migrated to Microsoft 365 GCC High, Purview + Copilot is a strong, compliant option inside that walled garden. The gap: Purview governs Microsoft Copilot — it does not stop employees pasting CUI into ChatGPT, Claude, or Gemini in a browser, and GCC High migration is only economical above ~200 seats.",
    theirApproach:
      "Microsoft 365 GCC High runs in physically separated US datacenters. Purview provides sensitivity labeling and DLP, and (extending into GCC High / DoD through 2026) endpoint DLP. Copilot in GCC High keeps data inside the Microsoft boundary. Governance is native to the Microsoft ecosystem and requires E5-class licensing plus a GCC High tenant.",
    theirStrengths: [
      "Genuinely compliant for CUI when you're all-in on M365 GCC High",
      "Deep, native integration with Microsoft 365 data and labels",
      "No third-party vendor in the data path for Microsoft-native workloads",
      "Backed by Microsoft's FedRAMP High / DoD IL authorizations",
    ],
    ourEdge: [
      {
        title: "Covers the tools your employees actually use",
        body: "The real leak is an engineer pasting a CAGE-coded spec into consumer ChatGPT. Purview governs Copilot, not third-party AI. HoundShield's proxy covers ChatGPT, Claude, Gemini and any OpenAI-compatible endpoint.",
      },
      {
        title: "No GCC High migration",
        body: "A GCC High migration is typically only economical above ~200 seats. HoundShield deploys on your existing infrastructure with a single URL change — viable for a 50-person contractor.",
      },
      {
        title: "Weeks-to-evidence, not a platform program",
        body: "Run the proxy 14 days → a $499 NIST 800-171-mapped PDF. No E5 rollout, no labeling program required first.",
      },
      {
        title: "Complements Purview",
        body: "Already on GCC High? HoundShield covers the third-party-AI gap Purview leaves open — the two are not mutually exclusive.",
      },
    ],
    matrix: [
      { dimension: "Governs ChatGPT / Claude / Gemini", houndshield: "Yes — any AI tool via proxy", competitor: "No — Microsoft Copilot only", advantage: "houndshield" },
      { dimension: "Requires GCC High migration", houndshield: "No", competitor: "Yes (E5 + tenant migration)", advantage: "houndshield" },
      { dimension: "Economical below 200 seats", houndshield: "Yes", competitor: "Rarely", advantage: "houndshield" },
      { dimension: "Data stays in-boundary", houndshield: "Yes (local scan)", competitor: "Yes (within GCC High)", advantage: "even" },
      { dimension: "Native M365 data/label integration", houndshield: "No", competitor: "Deep", advantage: "competitor" },
      { dimension: "Time to assessor evidence", houndshield: "~14 days → $499 PDF", competitor: "Platform program", advantage: "houndshield" },
    ],
    buyerFit:
      "Sub-200-seat defense contractors (Jordan) who can't justify GCC High but still need to prove AI governance over consumer AI tools.",
    chooseThemWhen: [
      "You're already fully migrated to M365 GCC High and only use Microsoft Copilot",
      "You have E5 licensing and 200+ seats to amortize the migration",
    ],
    chooseUsWhen: [
      "Employees use ChatGPT/Claude/Gemini, not just Copilot",
      "GCC High migration isn't economical at your size",
      "You need a fast, standalone assessment PDF for CMMC",
    ],
    faqs: [
      {
        q: "Does Microsoft Purview stop employees using ChatGPT?",
        a: "Purview governs Microsoft Copilot and M365 data. It does not intercept an employee pasting content into consumer ChatGPT, Claude, or Gemini in a browser. HoundShield's proxy covers any AI tool, locally.",
      },
      {
        q: "Do I need GCC High to use HoundShield?",
        a: "No. HoundShield runs on your existing infrastructure via a single proxy URL change — no GCC High tenant or E5 migration required. It can also complement an existing GCC High deployment.",
      },
    ],
    updated: UPDATED,
  },
  {
    slug: "polymer",
    competitor: "Polymer DLP",
    competitorShort: "Polymer",
    category: "Cloud-routed SaaS DLP",
    tagline:
      "Polymer is affordable, transparent cloud SaaS DLP. HoundShield adds what a CUI buyer needs: local scanning and a CMMC evidence PDF.",
    metaTitle: "HoundShield vs Polymer DLP — Local CMMC AI Firewall Comparison",
    metaDescription:
      "HoundShield vs Polymer DLP. Polymer is transparent, low-cost cloud SaaS DLP; HoundShield scans AI prompts locally (Mode B) so CUI/PHI never leaves your network and ships a $499 NIST 800-171 assessment PDF with an air-gapped option.",
    summary:
      "Polymer is a well-priced, transparent SaaS DLP with good SMB UX. But it's cloud-routed general DLP — it isn't built to keep CUI on-prem, and it doesn't produce a CMMC-mapped assessment artifact.",
    theirApproach:
      "Polymer provides low-cost, transparently priced SaaS DLP with a self-serve model, focused on scanning data in cloud SaaS apps and some AI surfaces. Inspection runs in Polymer's cloud.",
    theirStrengths: [
      "Transparent, low per-user pricing — easy to buy",
      "Clean self-serve SMB onboarding",
      "Good general SaaS DLP coverage",
      "Fast time-to-value for non-regulated teams",
    ],
    ourEdge: [
      {
        title: "Local scanning for regulated data",
        body: "HoundShield Mode B keeps prompt content on-prem. Polymer inspects in its cloud — fine for general data, not for CUI/PHI that can't leave the boundary.",
      },
      {
        title: "CMMC assessment PDF, not just DLP",
        body: "HoundShield ships a $499 NIST 800-171-mapped report. Polymer is DLP tooling, not a compliance-evidence deliverable.",
      },
      {
        title: "Air-gapped and defense-ready",
        body: "Mode C runs offline for IL-5+ networks — beyond a cloud SaaS DLP's reach.",
      },
      {
        title: "Purpose-built for AI prompt interception",
        body: "16 detection engines tuned for CUI/PHI/ITAR/CAGE/clearance markers in prompts, plus a SHA-256 hash-chained audit trail.",
      },
    ],
    matrix: [
      { dimension: "Where data is scanned", houndshield: "Locally (Mode B/C)", competitor: "Polymer's cloud", advantage: "houndshield" },
      { dimension: "Pricing transparency", houndshield: "$499 report + published plans", competitor: "Transparent, low per-user", advantage: "even" },
      { dimension: "CMMC / NIST 800-171 evidence PDF", houndshield: "Yes", competitor: "No", advantage: "houndshield" },
      { dimension: "Air-gapped deployment", houndshield: "Yes (Mode C)", competitor: "No", advantage: "houndshield" },
      { dimension: "General SaaS DLP breadth", houndshield: "AI-prompt focused", competitor: "Broad SaaS DLP", advantage: "competitor" },
      { dimension: "Regulated-industry fit", houndshield: "CMMC/HIPAA-first", competitor: "General-purpose", advantage: "houndshield" },
    ],
    buyerFit:
      "Healthcare (Rachel) and legal (Marcus) teams that liked Polymer's price but need regulated-data guarantees and an evidence artifact.",
    chooseThemWhen: [
      "You want inexpensive, transparent general SaaS DLP and your data isn't regulated CUI/PHI",
      "You prefer a fully self-serve, cloud-only model",
    ],
    chooseUsWhen: [
      "You handle CUI/PHI and need local, in-boundary scanning",
      "You need a CMMC/NIST 800-171 evidence PDF",
      "You need an air-gapped option",
    ],
    faqs: [
      {
        q: "Is Polymer good for CMMC?",
        a: "Polymer is general cloud SaaS DLP; it inspects data in its cloud and doesn't produce a CMMC-mapped assessment. HoundShield scans AI prompts locally and ships a $499 NIST 800-171 evidence PDF.",
      },
      {
        q: "Can I run HoundShield without sending data to the cloud?",
        a: "Yes. Mode B runs on your own Docker infrastructure and Mode C runs fully air-gapped — prompt content never leaves your network.",
      },
    ],
    updated: UPDATED,
  },
];

export const COMPARISON_SLUGS: string[] = COMPARISONS.map((c) => c.slug);

export function getComparison(slug: string): Comparison | undefined {
  return COMPARISONS.find((c) => c.slug === slug);
}

/**
 * The durable, category-defining claim that anchors the whole hub.
 * True only in Mode B — see editorial rules above.
 */
export const CORE_MOAT =
  "Every cloud AI-DLP tool routes your prompts to its servers to scan them — itself a potential CUI spill under DFARS 7012. HoundShield scans locally in under 10ms. Nothing leaves your network.";
