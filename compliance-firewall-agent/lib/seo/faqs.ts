/**
 * AEO (Answer Engine Optimization) — curated topical FAQ datasets.
 *
 * Each answer is written in the snippet-optimal 40–60 word "direct answer"
 * shape so it is eligible for Google featured snippets, People-Also-Ask
 * boxes, voice answers, and AI Overview / ChatGPT / Perplexity citation.
 *
 * Rules for every entry:
 *  - Question is phrased the way a real user types/speaks it (PAA-style).
 *  - Answer leads with a complete-sentence direct answer, no preamble.
 *  - Answer is concise (≈40–60 words). Snippet quality > length.
 *
 * Questions are kept DISTINCT across pages so each page emits a unique
 * FAQPage schema (no cross-URL duplication).
 */

/** An actionable "learn more" link rendered under an answer (never in the
 *  FAQPage schema text — snippet purity is preserved). Always site-internal. */
export interface FaqLink {
  label: string;
  href: string;
}

export interface FaqItem {
  question: string;
  answer: string;
  /** Optional cross-links surfaced as chips beneath the answer. */
  links?: FaqLink[];
}

/**
 * Deterministic, URL-safe slug for a question — the anchor target used for
 * deep-linkable / shareable FAQ answers (`/pricing#faq-<slug>`). Stable as
 * long as the question wording is (the AEO test freezes both wording and
 * cross-set uniqueness, so slugs are unique across the whole site).
 */
export function faqSlug(question: string): string {
  return (
    "faq-" +
    question
      .toLowerCase()
      .replace(/['’"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/g, "")
  );
}

/** /hipaa — PHI and healthcare-specific. */
export const hipaaFaqs: FaqItem[] = [
  {
    question: "Is ChatGPT HIPAA compliant?",
    answer:
      "ChatGPT is not HIPAA compliant by default — pasting PHI into a consumer AI tool is an impermissible disclosure without a Business Associate Agreement. HoundShield lets clinical and billing staff use AI safely by detecting all 18 HIPAA identifiers in each prompt and blocking PHI before it reaches the model.",
  },
  {
    question: "How does HoundShield protect PHI in AI tools?",
    answer:
      "HoundShield scans every AI prompt for the 18 HIPAA Safe Harbor identifiers — names, dates, MRNs, account numbers, biometric data, and more — in under 10ms. Prompts containing PHI are blocked or quarantined before they reach ChatGPT, Copilot, or Claude, and every detection is written to an immutable audit log.",
    links: [{ label: "Healthcare deployment", href: "/products/healthcare" }],
  },
  {
    question: "What are the 18 HIPAA identifiers?",
    answer:
      "The 18 HIPAA Safe Harbor identifiers include names, geographic data smaller than a state, all date elements, phone and fax numbers, email addresses, Social Security numbers, medical record numbers, health plan beneficiary numbers, account numbers, certificate or license numbers, vehicle and device identifiers, URLs, IP addresses, biometric identifiers, full-face photos, and any other unique identifying code.",
  },
  {
    question: "Does HIPAA apply to AI tools like ChatGPT?",
    answer:
      "Yes. HIPAA applies whenever PHI is created, received, maintained, or transmitted — including pasting it into an AI tool. Without a signed Business Associate Agreement, sending PHI to a cloud AI provider is a reportable breach. HoundShield prevents this by scanning and blocking PHI locally before transmission.",
  },
];

/** /pricing — cost and plan questions ("how much does X cost"). */
export const pricingFaqs: FaqItem[] = [
  {
    question: "How much does the AI Risk Assessment Report cost?",
    answer:
      "$499, one time. No subscription, no per-seat licence, no signup required. We run HoundShield's proxy across 14 days of your real AI traffic and deliver a SHA-256-signed PDF that scores every prompt event against NIST 800-171 and HIPAA.",
    links: [{ label: "See what the report covers", href: "/assessment" }],
  },
  {
    question: "Is there a subscription?",
    answer:
      "No. HoundShield sells exactly one thing: the $499 one-time report. We would rather prove the report is worth paying for than sell you a plan you have to remember to cancel. If continuous monitoring is what you need, tell us — that decides whether we build it.",
  },
  {
    question: "Why $499 specifically?",
    answer:
      "Because it sits below most corporate-card and signature thresholds, so it does not need procurement approval, a security review or a legal redline. A compliance officer can expense it and have evidence in two weeks. A recurring subscription, counter-intuitively, triggers more scrutiny than a larger one-time charge, because recurring spend needs a budget owner.",
  },
  {
    question: "Can I try it before paying?",
    answer:
      "Yes, and without an account. Paste a prompt into the scanner at /demo and it is analysed entirely in your browser, on your own device — the same detection engines that ship in the product. You get on-screen findings and a preview PDF. Nothing you paste is transmitted to us, which is exactly the property you are buying.",
    links: [{ label: "Try the free in-browser scan", href: "/demo#snapshot" }],
  },
  {
    question: "Do I need this if CMMC Phase 2 is suspended?",
    answer:
      "The certification gate was paused on 13 July 2026; the underlying obligation was not. You must still implement NIST SP 800-171 Rev 2 and still submit an annual SPRS self-assessment. With no third-party assessor in the loop, that score is your own representation to the government — and DOJ has settled fifteen False Claims Act cases over exactly that, including $4.6M from MORSECORP and $507,144 from LOGZONE. Evidence matters more now, not less.",
  },
  {
    // Rewritten 2026-08-14. This previously read "Every paid HoundShield plan can
    // be billed annually at a 20% discount... Contact sales for multi-tenant
    // agency pricing." Three problems, all of them shipped inside FAQPage JSON-LD
    // that answer engines quote verbatim: there is no subscription to bill
    // annually, the 20% figure contradicted the 17% recorded in CLAUDE.md, and
    // "every paid plan" implied a tier list /pricing does not sell. Same defect
    // class as the schema.org six-tier bug fixed in #275 — machine-readable
    // output describing products with no checkout behind them.
    question: "Is there a subscription, or a refund if the report is not useful?",
    answer:
      "Neither applies the way people expect. There is no subscription: the CMMC AI Risk Assessment Report is a one-time $499 purchase, charged once, with no seats to count and no renewal — which is also why it clears a purchase order without a procurement review. And yes, there is a 30-day money-back guarantee: request a refund within 30 days of purchase and you get the full amount back, including after the PDF has been delivered. The full terms are published at houndshield.com/refund.",
  },
];

/** Homepage — the top-of-funnel "what is this" questions. */
export const homeFaqs: FaqItem[] = [
  {
    question: "What is HoundShield?",
    answer:
      "HoundShield is a local-only AI compliance firewall. It sits between your team and tools like ChatGPT, Copilot, and Claude, scans every prompt on your own hardware in under 10 milliseconds, blocks CUI, PHI, and PII before anything leaves your network, and writes tamper-evident audit evidence mapped to NIST 800-171.",
    links: [
      { label: "How it works", href: "/how-it-works" },
      { label: "See features", href: "/features" },
    ],
  },
  {
    question: "How does HoundShield stop employees pasting CUI into ChatGPT?",
    answer:
      "HoundShield works as an OpenAI-compatible proxy: you change one base URL and every AI request passes through 16 local detection engines before it leaves your perimeter. Prompts containing CUI markings, CAGE codes, contract numbers, or clearance terms are blocked instantly and logged to a SHA-256 hash-chained audit trail.",
  },
  {
    question: "Does HoundShield send my prompts to the cloud?",
    answer:
      "No. In self-hosted Docker mode, scanning happens entirely on your infrastructure and prompt content never leaves your network — unlike cloud DLP tools, which must receive your data to inspect it. Only the hosted trial runs in our cloud, and it is for demos and non-CUI evaluation only.",
  },
  {
    question: "Who is HoundShield for?",
    answer:
      "HoundShield is built for regulated teams that use AI: defense contractors preparing for CMMC Level 2, healthcare organizations protecting PHI under HIPAA, and law firms guarding privileged communications. If your staff use ChatGPT, Copilot, or Claude and an auditor will ever ask for evidence, HoundShield is for you.",
    links: [
      { label: "Healthcare", href: "/products/healthcare" },
      { label: "Defense", href: "/products/defense" },
    ],
  },
  {
    question: "How quickly can we get started with HoundShield?",
    answer:
      "Most teams deploy in under 15 minutes: run the Docker gateway, point your AI tools' base URL at it, and verify a test prompt in the audit log. The in-browser scanner at /demo needs no account at all, and the $499 assessment report delivers signed evidence within days of intake.",
  },
];

/** /assessment — the $499 one-time report (the Stage-1 lead product). */
export const reportFaqs: FaqItem[] = [
  {
    question: "What is the CMMC AI Risk Assessment Report?",
    answer:
      "It is a one-time $499 engagement. HoundShield's proxy runs locally in your environment for 14 days, scoring every AI prompt event against NIST 800-171 Rev 2. You receive a SHA-256-signed PDF documenting what your team sent to AI tools, which controls it implicates, and the remediation sequence.",
    links: [
      { label: "Compare plans", href: "/pricing" },
      { label: "How it works", href: "/how-it-works" },
    ],
  },
  {
    question: "How long does the $499 assessment take?",
    answer:
      "Fourteen days of passive scanning plus a few days to compile the report. Setup is a one-URL change behind a Docker container you run yourself, so there is no disruption — your team keeps using ChatGPT, Copilot, and Claude normally while the proxy observes and scores the traffic.",
  },
  {
    question: "Is my data safe during the assessment?",
    answer:
      "Yes. The proxy runs on your own infrastructure in Mode B, so prompt content never leaves your network — we never see it. The report is built from local scan results and control mappings only, and the audit trail is SHA-256 hash-chained so evidence cannot be silently altered.",
  },
  {
    question: "Do I need a HoundShield subscription to buy the report?",
    answer:
      "No. The report is a standalone $499 purchase with no subscription, no signup, and no procurement cycle — checkout takes a card and an email address. Many teams later add a monthly plan for continuous monitoring, but the report stands on its own as assessor-ready evidence.",
  },
  {
    question: "Will a C3PAO accept the report as evidence?",
    answer:
      "The report is designed as supporting evidence: findings are mapped to specific NIST 800-171 Rev 2 controls with SPRS impact, and every event carries a tamper-evident hash. Assessors make their own judgments, but control-mapped, hash-chained documentation of AI usage is exactly the artifact they ask contractors to produce.",
  },
];

/** /contact — the pre-sales questions people ask before writing to us. */
export const contactFaqs: FaqItem[] = [
  {
    question: "Is CMMC Level 2 certification still required?",
    answer:
      "Not right now. On 13 July 2026 the Department of War suspended CMMC Phase 2, which would have made third-party (C3PAO) certification a condition of award from 10 November 2026; Phases 3 and 4 are frozen pending a 60-day review. What did NOT change: DFARS 252.204-7012 still applies, you must still implement the 110 NIST SP 800-171 Rev 2 controls, and your annual SPRS self-assessment score is still mandatory. The certificate was paused. The obligation was not.",
  },
  {
    question: "If certification is suspended, why do I still need evidence?",
    answer:
      "Because self-attestation is now the only gate, and it is the one the Justice Department prosecutes. Under its Civil Cyber-Fraud Initiative, DOJ has settled fifteen False Claims Act cases — MORSECORP paid $4.6M for an inflated SPRS score, LOGZONE $507,144 for certifying a perfect 110 with controls unimplemented. With no assessor in the loop, the score you submit is your own representation to the government. HoundShield produces the evidence behind it.",
    links: [
      { label: "Get the $499 report", href: "/pricing" },
      { label: "See how it works", href: "/how-it-works" },
    ],
  },
  {
    question: "How long does it take to get evidence with HoundShield?",
    answer:
      "The $499 AI Risk Assessment Report is a 14-day run: deploy the gateway, let it observe real AI usage, and receive a signed PDF mapped to NIST 800-171. You can see the scan engine work in seconds — paste a prompt into our in-browser demo and it is analysed on your own device, with nothing transmitted.",
    links: [
      { label: "Try the live scan", href: "/demo#snapshot" },
      { label: "Get the $499 report", href: "/pricing" },
    ],
  },
  {
    question: "What does HoundShield cost?",
    answer:
      "One price: $499, one time, for the AI Risk Assessment Report. There is no subscription, no per-seat licence and no contract. At $499 it sits below most corporate-card and signature thresholds, so it does not need procurement approval. The in-browser prompt scan at /demo is free and needs no account.",
    links: [{ label: "Pricing", href: "/pricing" }],
  },
  {
    question: "Can I export compliance reports from HoundShield?",
    answer:
      "Yes. The $499 AI Risk Assessment Report is delivered as an audit-ready PDF mapped to NIST 800-171, alongside your System Security Plan (SSP) and Plan of Action & Milestones (POA&M). Every artifact carries SHA-256-signed, hash-chained evidence so an assessor — or an investigator — can verify it was not altered after the fact.",
  },
  {
    question: "Is my data secure with HoundShield?",
    answer:
      "Prompt content never leaves your network. HoundShield scans locally: in the self-hosted Docker mode (Mode B), the CUI-safe deployment, nothing you scan is transmitted to us. The hosted trial runs on Vercel, which is not FedRAMP-authorized, so it is for non-CUI evaluation only. Audit logs are immutable and SHA-256 hash-chained, and we never train AI models on your data.",
  },
];

/** /features — capability questions. */
export const featuresFaqs: FaqItem[] = [
  {
    question: "How fast is HoundShield's AI prompt scanning?",
    answer:
      "HoundShield scans each AI prompt in under 10 milliseconds. Detection runs locally across 16 engines, so there is no perceptible latency for users. The streamed AI response is also scanned token-by-token, so if a model begins emitting a credit-card or Social Security number mid-reply, the output is truncated before delivery.",
  },
  {
    question: "Does HoundShield generate audit logs for compliance?",
    answer:
      "Yes. Every scan decision is written to a tamper-evident audit trail secured with a SHA-256 hash chain, so records cannot be altered without detection. The logs map to NIST 800-171 controls and export as C3PAO-ready PDF evidence, giving assessors and auditors a defensible record of every AI interaction.",
  },
  {
    question: "What is SPRS scoring and does HoundShield calculate it?",
    answer:
      "SPRS (Supplier Performance Risk System) scoring rates a contractor's NIST 800-171 implementation from -203 to +110. HoundShield automatically calculates your SPRS score across all 110 controls, shows which controls are met or missing, and produces the documentation you file in SPRS for a CMMC Level 2 self-assessment.",
    links: [{ label: "Get the $499 report", href: "/assessment" }],
  },
  {
    question: "Which AI models does HoundShield support?",
    answer:
      "HoundShield works with any OpenAI-compatible API and routes approved traffic to over 800 models, including GPT, Claude, Gemini, and open-source models. Because it operates at the network proxy layer, you add new models without changing the compliance configuration or installing anything on user devices.",
  },
];

/** /how-it-works — process / deployment-mode questions. */
export const howItWorksFaqs: FaqItem[] = [
  {
    question: "What deployment modes does HoundShield offer?",
    answer:
      "HoundShield offers three modes. Cloud mode is hosted for fast demos and non-CUI workloads. Self-hosted Docker mode runs entirely inside your network and is CUI-safe for defense workloads. Air-gapped mode supports IL-5+ environments with no outbound connectivity, so even isolated networks get full AI compliance scanning.",
  },
  {
    question: "Which HoundShield mode is CUI-safe for defense contractors?",
    answer:
      "The self-hosted Docker mode is CUI-safe because all scanning happens inside your control boundary and no prompt content leaves your network. For the strictest environments, air-gapped mode runs with zero outbound connectivity. Cloud mode is for demos and non-CUI workloads only, never for Controlled Unclassified Information.",
    links: [{ label: "Security & data boundary", href: "/security" }],
  },
  {
    question: "Do employees need to install anything to use HoundShield?",
    answer:
      "No per-machine agent is required. HoundShield works at the network proxy layer, so employees simply change one base URL in their AI tool to point at your HoundShield endpoint. Administrators deploy the gateway once with Docker, and every user is protected immediately without local installs.",
  },
];

/** /brain-ai — the autonomous compliance copilot. */
export const brainAiFaqs: FaqItem[] = [
  {
    question: "What is Brain AI in HoundShield?",
    answer:
      "Brain AI is HoundShield's built-in compliance copilot. It answers CMMC, HIPAA, and SOC 2 questions, explains your SPRS score and missing controls, and guides remediation — all grounded in the 110 NIST 800-171 controls. It runs on the HERMES agent architecture inside your HoundShield deployment.",
    links: [{ label: "See features", href: "/features" }],
  },
  {
    question: "Does Brain AI work without an API key?",
    answer:
      "Yes. Brain AI ships with a local FAQ knowledge layer so core compliance answers and product questions work instantly even with no LLM provider configured. When an API key is present, it adds deeper reasoning, but the demo-critical answers never depend on an external model being reachable.",
  },
  {
    question: "Can Brain AI automate CMMC compliance work?",
    answer:
      "Brain AI continuously scores your environment against all 110 NIST 800-171 controls, flags which controls are met or missing, drafts remediation steps, and assembles C3PAO-ready evidence. It automates the repetitive assessment and documentation work so your team focuses on closing real gaps before the deadline.",
  },
  {
    question: "Is Brain AI safe to use with CUI and regulated data?",
    answer:
      "Yes. Brain AI operates inside HoundShield's local-only boundary, so prompt content and compliance data never leave your network. In self-hosted and air-gapped modes all reasoning stays within your control boundary, which keeps Brain AI usable for CUI workloads that cloud assistants cannot legally touch.",
  },
];

/** /docs install steps — used for HowTo schema and an install FAQ. */
export const installFaqs: FaqItem[] = [
  {
    question: "How do I install HoundShield?",
    answer:
      "Install HoundShield in three steps: deploy the gateway with Docker, point your AI tools' base URL at your HoundShield endpoint, and confirm a test prompt is scanned in your audit log. Most teams finish in under 15 minutes, and no agent needs to be installed on individual machines.",
  },
];

/** Ordered install steps for HowTo structured data + a visible step list. */
export interface HowToStep {
  name: string;
  text: string;
}

export const installSteps: HowToStep[] = [
  {
    name: "Deploy the HoundShield gateway",
    text: "Run the HoundShield Docker container inside your network with three commands. The gateway hosts your private compliance endpoint and requires no per-machine agent.",
  },
  {
    name: "Point your AI tools at HoundShield",
    text: "Change the base URL in your AI tools to the gateway you deployed in step 1 — your own host, for example https://houndshield.internal.example.com/v1 — instead of the cloud AI API. This is the only client-side change required.",
  },
  {
    name: "Send a test prompt and verify the audit log",
    text: "Send a prompt that contains test CUI or PHI and confirm it is blocked and recorded in your tamper-evident audit trail. Once verified, your team's AI usage is compliant.",
  },
];

/**
 * Consolidated /faq hub grouping.
 *
 * Each group reuses an EXISTING page dataset verbatim — no new questions are
 * authored here, so cross-set question uniqueness (and therefore deep-link
 * slug uniqueness) is preserved. The hub renders these visibly for UX/AEO
 * value but deliberately does NOT emit its own FAQPage JSON-LD: every Q&A
 * already carries FAQPage schema on its origin page, and re-emitting it here
 * would create cross-URL structured-data duplication.
 */
export interface FaqGroup {
  /** Stable anchor id for the category jump-nav (`/faq#<id>`). */
  id: string;
  title: string;
  /** One-line description shown under the category heading. */
  blurb: string;
  items: FaqItem[];
}

export const faqHubGroups: FaqGroup[] = [
  {
    id: "basics",
    title: "HoundShield basics",
    blurb: "What HoundShield is, who it's for, and how fast you can start.",
    items: homeFaqs,
  },
  {
    id: "pricing",
    title: "Pricing & the $499 report",
    blurb: "The one-time $499 AI Risk Assessment Report — the only thing we sell.",
    items: [...pricingFaqs, ...reportFaqs],
  },
  {
    id: "cmmc",
    title: "CMMC & getting certified",
    blurb: "Level 2, C3PAO assessments, timelines, and what evidence you can export.",
    items: contactFaqs,
  },
  {
    id: "hipaa",
    title: "HIPAA & healthcare",
    blurb: "Using ChatGPT with PHI, the 18 identifiers, and staying HIPAA-safe.",
    items: hipaaFaqs,
  },
  {
    id: "deployment",
    title: "Deployment & security",
    blurb: "Cloud, self-hosted Docker, and air-gapped modes — and which is CUI-safe.",
    items: [...howItWorksFaqs, ...installFaqs],
  },
  {
    id: "features",
    title: "Features & scanning",
    blurb: "Detection speed, audit logs, SPRS scoring, and supported AI models.",
    items: featuresFaqs,
  },
  {
    id: "brain-ai",
    title: "Brain AI copilot",
    blurb: "The built-in compliance copilot — how it works and whether it's CUI-safe.",
    items: brainAiFaqs,
  },
];
