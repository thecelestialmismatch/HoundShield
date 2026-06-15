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

export interface FaqItem {
  question: string;
  answer: string;
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
    question: "How much does HoundShield cost?",
    answer:
      "HoundShield offers a free tier for AI prompt scanning and basic reports, then paid plans: Pro at $199/month, Growth at $499/month, Enterprise at $999/month, and Federal at $2,499/month for multi-tenant agency deployments. Higher tiers add gateway mode, SPRS tracking, C3PAO-ready PDF evidence, and dedicated support.",
  },
  {
    question: "Is there a free version of HoundShield?",
    answer:
      "Yes. HoundShield's free tier includes real-time AI prompt scanning across the core detection engines plus basic compliance reports, so you can start protecting AI usage at no cost. Paid plans add gateway mode, multi-user access, SPRS score tracking, and C3PAO-ready PDF evidence export.",
  },
  {
    question: "Do I need the Enterprise plan for a CMMC assessment?",
    answer:
      "Not necessarily. SPRS scoring and CUI detection are available on Growth ($499/month), which covers most contractors preparing for a self-assessment. The Enterprise plan ($999/month) adds C3PAO-ready PDF evidence packages and dedicated support, which are useful when a certified third-party assessor reviews your environment on-site.",
  },
  {
    question: "Does HoundShield offer annual billing?",
    answer:
      "Yes. Every paid HoundShield plan can be billed annually, which lowers the effective monthly cost compared with month-to-month billing. Annual billing is the typical choice for contractors and healthcare teams budgeting against a fixed compliance deadline. Contact sales for federal and multi-tenant agency pricing.",
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
    text: "Change the base URL in your AI tools to your HoundShield endpoint, for example https://gateway.houndshield.com/v1, instead of the cloud AI API. This is the only client-side change required.",
  },
  {
    name: "Send a test prompt and verify the audit log",
    text: "Send a prompt that contains test CUI or PHI and confirm it is blocked and recorded in your tamper-evident audit trail. Once verified, your team's AI usage is compliant.",
  },
];
