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
      "Prompt Security is a capable enterprise AI gateway — now part of SentinelOne — that inspects LLM traffic through the browser and a cloud service, with an on-premises SKU announced in 2026 for disconnected environments. The default cloud delivery reintroduces the SC.3.177 transit problem for regulated data; the on-prem option removes it, but arrives as an enterprise platform SKU through enterprise procurement.",
    theirApproach:
      "Prompt Security sits between employees and AI apps (browser extension + proxy), inspecting prompts and responses for sensitive data, prompt injection, and shadow-AI usage. It is delivered primarily as a managed cloud service; following the SentinelOne acquisition it sits inside a broader enterprise security suite, and SentinelOne has announced an on-premises version aimed at disconnected and air-gapped environments. Confirm current deployment options and pricing with their team.",
    theirStrengths: [
      "Strong prompt-injection and shadow-AI discovery, not just DLP",
      "Enterprise backing and integration with SentinelOne's platform",
      "Broad LLM-app coverage across the browser",
      "Good fit for large enterprises already standardized on SentinelOne",
    ],
    ourEdge: [
      {
        title: "Local-first, not local-as-enterprise-upsell",
        body: "HoundShield Mode B keeps prompt content on your own infrastructure by design and by default — $499 self-serve, Docker, minutes to deploy. SentinelOne's on-prem Prompt Security SKU validates the architecture, but it ships as an enterprise platform purchase; their default cloud delivery still routes inspection through their service, which for CUI is the exposure you're trying to remove.",
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
      { dimension: "Where prompts are scanned", houndshield: "Locally by default (Mode B/C)", competitor: "Cloud service by default; on-prem as enterprise SKU", advantage: "houndshield" },
      { dimension: "Pricing model", houndshield: "$499 report + per-org plans", competitor: "Per-seat, enterprise-quoted", advantage: "houndshield" },
      { dimension: "Prompt-injection / shadow-AI detection", houndshield: "Prompt scanning + audit; injection on roadmap", competitor: "Mature", advantage: "competitor" },
      { dimension: "CMMC / NIST 800-171 evidence PDF", houndshield: "$499 one-time, control-mapped", competitor: "Not a deliverable", advantage: "houndshield" },
      { dimension: "Air-gapped deployment", houndshield: "Yes (Mode C), self-serve", competitor: "On-prem SKU announced (2026), enterprise procurement", advantage: "even" },
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
        a: "SentinelOne announced an on-premises Prompt Security SKU in 2026 for disconnected and air-gapped environments — sold as part of its enterprise platform. The default delivery remains a managed cloud service. HoundShield's Mode B runs on your own Docker infrastructure by design and by default, self-serve from $499, so prompt content never leaves your network regardless of tier.",
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
      "Purview governs Copilot inside GCC High. HoundShield covers ChatGPT, Claude, and Gemini too — one proxy, a CMMC evidence PDF, and no GCC High migration.",
    metaTitle: "HoundShield vs Microsoft Purview + GCC High Copilot for CMMC (2026)",
    metaDescription:
      "HoundShield vs Microsoft Purview and GCC High Copilot. Purview governs Microsoft Copilot inside a GCC High tenant (E5 + costly migration); it doesn't cover ChatGPT/Claude/Gemini in the browser. HoundShield scans any AI tool locally with a $499 NIST 800-171 evidence PDF — no GCC High migration.",
    summary:
      "If your organization is fully migrated to Microsoft 365 GCC High, Purview + Copilot is a strong, compliant option inside that ecosystem. The gap: Purview governs Microsoft Copilot natively; covering third-party browser AI (ChatGPT, Claude, Gemini) leans on Purview Endpoint DLP configured across every device, still doesn't yield a CMMC-mapped AI assessment PDF, and the GCC High path is typically only economical above ~200 seats.",
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
        body: "The real leak is an engineer pasting a CAGE-coded spec into consumer ChatGPT. Purview governs Copilot natively; catching third-party browser AI leans on Endpoint DLP deployed to every device. HoundShield's single proxy covers ChatGPT, Claude, Gemini and any OpenAI-compatible endpoint.",
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
      { dimension: "Governs ChatGPT / Claude / Gemini", houndshield: "Yes — any AI tool via one proxy", competitor: "Only via per-device Endpoint DLP; native scope is Copilot", advantage: "houndshield" },
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
        a: "Purview governs Microsoft Copilot and M365 data natively; restricting content pasted into consumer ChatGPT, Claude, or Gemini relies on Purview Endpoint DLP policies deployed to each device, and still doesn't produce a CMMC AI assessment. HoundShield's single proxy covers any AI tool, scanned locally, and ships the $499 evidence PDF.",
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

  // ── Tier-1 SEO sprint (2026-07-10) — additive only; entries above unchanged ──
  {
    slug: "strac",
    competitor: "Strac",
    competitorShort: "Strac",
    category: "Cloud-routed AI & SaaS DLP",
    tagline:
      "Strac redacts sensitive data across SaaS apps by scanning it in Strac's cloud. HoundShield scans AI prompts inside your network — nothing leaves the boundary.",
    metaTitle: "HoundShield vs Strac — Local vs Cloud-Routed AI DLP for CMMC (2026)",
    metaDescription:
      "An honest HoundShield vs Strac comparison for CMMC and HIPAA buyers. Strac scans and redacts content in its cloud across SaaS and AI surfaces; HoundShield scans locally (Mode B) so CUI/PHI never leaves your network, with a $499 NIST 800-171 evidence PDF.",
    summary:
      "Strac is a capable SaaS DLP with strong redaction UX across email, ticketing, and AI surfaces — but like other cloud DLPs, its published architecture inspects content in Strac's cloud. For a buyer whose problem is regulated data leaving the network, the inspection path is the exposure.",
    theirApproach:
      "Strac provides SaaS and endpoint DLP with automatic detection and redaction of sensitive data (PII, PHI, payment data) across tools like email, Slack, Zendesk, and generative AI apps. Content is scanned by Strac's cloud service, which then redacts or blocks per policy.",
    theirStrengths: [
      "Polished redaction workflow — masks the sensitive element instead of blocking the whole message",
      "Broad SaaS app catalog beyond AI (email, support desks, chat, storage)",
      "Quick SaaS onboarding with no infrastructure to run",
      "Solid PII/PHI detector coverage for general privacy programs",
    ],
    ourEdge: [
      {
        title: "Scanning happens inside your boundary",
        body: "HoundShield Mode B (self-hosted Docker) inspects every AI-bound prompt on your own infrastructure in <10ms. A cloud DLP must receive your content to scan it — for CUI under DFARS 7012, that transit is the exposure you were trying to prevent.",
      },
      {
        title: "CMMC evidence artifact, not just prevention",
        body: "The $499 CMMC AI Risk Assessment maps every prompt event to NIST 800-171 Rev 2 controls in a SHA-256-signed PDF — a deliverable your assessor reads. General DLP dashboards don't translate to assessor evidence.",
      },
      {
        title: "One proxy covers every AI tool",
        body: "Any OpenAI-compatible endpoint — ChatGPT, Copilot, Claude, Gemini — is covered by one URL change at the network level, rather than per-app SaaS integrations.",
      },
      {
        title: "Air-gapped option for defense environments",
        body: "Mode C runs with no external connectivity at all. Cloud-native DLP architectures cannot follow you into an isolated network.",
      },
    ],
    matrix: [
      { dimension: "Where content is scanned", houndshield: "Locally, inside your network (Mode B/C)", competitor: "In Strac's cloud", advantage: "houndshield" },
      { dimension: "CUI/PHI leaves your boundary to be checked?", houndshield: "No", competitor: "Yes — sent to their service to scan", advantage: "houndshield" },
      { dimension: "CMMC / NIST 800-171 evidence PDF", houndshield: "$499 one-time, control-mapped", competitor: "Not a deliverable", advantage: "houndshield" },
      { dimension: "SaaS app coverage beyond AI", houndshield: "AI endpoints via proxy", competitor: "Email, Slack, Zendesk, storage, and more", advantage: "competitor" },
      { dimension: "Redaction UX", houndshield: "Block/quarantine with audit trail", competitor: "Inline masking of the sensitive element", advantage: "competitor" },
      { dimension: "Air-gapped deployment", houndshield: "Yes (Mode C)", competitor: "No (cloud-native)", advantage: "houndshield" },
    ],
    buyerFit:
      "Defense subcontractors and healthcare privacy officers whose core requirement is that regulated content never transits a vendor cloud — and who need assessor-grade evidence, not just prevention.",
    chooseThemWhen: [
      "Your priority is broad SaaS DLP (email, ticketing, chat) and your data isn't barred from cloud inspection",
      "You want inline redaction UX across many SaaS apps with zero infrastructure",
    ],
    chooseUsWhen: [
      "You handle CUI, ITAR, or PHI that cannot leave your network — even to be scanned",
      "You need a NIST 800-171-mapped assessment PDF for a C3PAO or auditor",
      "You need on-prem or air-gapped deployment",
    ],
    faqs: [
      {
        q: "Does Strac scan content in its own cloud?",
        a: "Strac's published architecture is a cloud service: content from your SaaS apps and AI surfaces is scanned by Strac to detect and redact sensitive data. HoundShield's Mode B scans on your own infrastructure, so content never leaves your network to be checked.",
      },
      {
        q: "Is Strac suitable for CMMC compliance?",
        a: "Strac is general-purpose DLP and can strengthen a privacy program, but it does not keep CUI inside your boundary during scanning and does not produce a control-mapped CMMC artifact. HoundShield scans locally and ships a $499 NIST 800-171 evidence PDF.",
      },
    ],
    updated: "2026-07-10",
  },
  {
    slug: "witnessai",
    competitor: "WitnessAI",
    competitorShort: "WitnessAI",
    category: "Enterprise AI governance platform",
    tagline:
      "WitnessAI is enterprise AI governance with a federal go-to-market. HoundShield is the mid-market answer: deployed in minutes, evidence in 14 days, $499 to start.",
    metaTitle: "HoundShield vs WitnessAI — SMB CMMC AI Firewall vs Enterprise Platform",
    metaDescription:
      "An honest HoundShield vs WitnessAI comparison. WitnessAI is an enterprise AI governance platform with a strong federal channel; HoundShield serves 5–500 person contractors with local scanning (Mode B), self-serve Docker deployment, and a $499 NIST 800-171 evidence PDF.",
    summary:
      "WitnessAI is a serious enterprise AI security and governance platform with deep observability and a federal-friendly channel (it sells through Carahsoft and has heavyweight security leadership on its board). For a 50–500 person contractor, the gap is fit: enterprise platforms mean enterprise procurement, enterprise pricing, and enterprise deployment timelines. HoundShield is built for the buyer who needs enforcement this week and assessor evidence this month.",
    theirApproach:
      "WitnessAI provides an enterprise platform for observing, governing, and securing employee AI usage — visibility into which AI apps are in use, policy enforcement, and protection against prompt-level risks — sold primarily to large enterprises and public-sector buyers through channel partners.",
    theirStrengths: [
      "Enterprise-scale AI observability and governance breadth",
      "Federal-friendly go-to-market through the Carahsoft channel",
      "Credible security pedigree, including former senior US intelligence leadership as advisors",
      "Fits organizations that need company-wide AI governance beyond prompt blocking",
    ],
    ourEdge: [
      {
        title: "Built for the 5–500 person contractor",
        body: "HoundShield deploys as self-hosted Docker (Mode B) in minutes and starts at a $499 one-time assessment — no enterprise sales cycle, no platform rollout. The DIB mid-market can't wait a procurement quarter for AI controls.",
      },
      {
        title: "Evidence in 14 days",
        body: "The $499 CMMC AI Risk Assessment runs two weeks in your environment and produces a SHA-256-signed PDF mapping every AI prompt event to NIST 800-171 Rev 2 — an artifact you hand your C3PAO, not a dashboard you interpret.",
      },
      {
        title: "Transparent, published pricing",
        body: "The report is $499. Plans are published on the pricing page. Enterprise platforms are quoted — and quotes gate SMBs out.",
      },
      {
        title: "Local-only data path by design",
        body: "In Mode B, prompt scanning happens entirely on your infrastructure; in Mode C it runs air-gapped. Nothing about your AI usage — content or metadata — needs to reach us.",
      },
    ],
    matrix: [
      { dimension: "Target buyer", houndshield: "5–500 person DIB / healthcare / legal", competitor: "Large enterprise and federal", advantage: "even" },
      { dimension: "Time to deployment", houndshield: "Minutes (self-hosted Docker)", competitor: "Enterprise rollout cycle", advantage: "houndshield" },
      { dimension: "Entry price", houndshield: "$499 one-time assessment, published plans", competitor: "Enterprise-quoted", advantage: "houndshield" },
      { dimension: "CMMC / NIST 800-171 evidence PDF", houndshield: "Yes — control-mapped, signed", competitor: "Governance reporting, not a CMMC assessment artifact", advantage: "houndshield" },
      { dimension: "AI governance breadth at enterprise scale", houndshield: "Focused prompt firewall + audit", competitor: "Broad observability and governance platform", advantage: "competitor" },
      { dimension: "Federal channel presence", houndshield: "Direct + RPO/MSP partners", competitor: "Established Carahsoft channel", advantage: "competitor" },
    ],
    buyerFit:
      "Defense subcontractors, clinics, and law firms in the 5–500 person range who need enforced AI controls and assessor-grade evidence now — without an enterprise platform project.",
    chooseThemWhen: [
      "You are a large enterprise or agency buying AI governance company-wide through an established federal channel",
      "You need broad AI usage observability across thousands of employees, beyond prompt-level blocking",
    ],
    chooseUsWhen: [
      "You are a 5–500 person contractor who needs CUI/PHI blocked this week, not next quarter",
      "You need a NIST 800-171-mapped assessment PDF for a C3PAO on a deadline",
      "You want published pricing and self-serve Docker deployment on your own infrastructure",
    ],
    faqs: [
      {
        q: "Is WitnessAI available to small defense contractors?",
        a: "WitnessAI sells primarily to large enterprises and public-sector buyers through channel partners, with quoted pricing. Most 50–500 person contractors find the procurement path and price point sized for enterprises — which is exactly the gap HoundShield's $499 self-serve assessment fills.",
      },
      {
        q: "Does HoundShield replace an AI governance platform?",
        a: "For a mid-market contractor, usually yes: the requirement is enforced blocking of regulated data plus assessor evidence, which the local proxy and the $499 NIST 800-171-mapped report deliver. A global enterprise wanting organization-wide AI observability may genuinely need a platform like WitnessAI.",
      },
    ],
    updated: "2026-07-10",
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
