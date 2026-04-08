/**
 * Brain AI — Local Compliance FAQ Engine
 *
 * Provides instant, accurate answers to common CMMC/HIPAA/SOC2 questions
 * WITHOUT requiring an OpenRouter API key. This ensures Brain AI always
 * works in production even if the LLM provider is unavailable.
 *
 * Strategy:
 *  1. Keyword-match incoming question against FAQ entries
 *  2. Return the best-matching answer (cosine-lite scoring)
 *  3. Return null if confidence < threshold → caller falls back to LLM
 */

export interface FaqEntry {
  keywords: string[];
  answer: string;
}

const FAQ_DB: FaqEntry[] = [
  {
    keywords: ["cmmc", "level 2", "cmmc 2", "cybersecurity maturity", "what is cmmc"],
    answer:
      "**CMMC Level 2** requires US defense contractors to implement all **110 NIST 800-171 Rev 2 controls**. It protects Controlled Unclassified Information (CUI) across your supply chain. Enforcement begins November 2026 — you'll need a certified C3PAO assessment ($30K–$150K) or a self-assessment with a SPRS score filed in SPRS. Kaelus automates your SPRS scoring, detects CUI in every AI prompt, and generates audit-ready reports.",
  },
  {
    keywords: ["sprs", "score", "sprs score", "scoring", "points", "110 points"],
    answer:
      "**SPRS (Supplier Performance Risk System)** is where you file your CMMC self-assessment score. It ranges from **−203 to +110**. Each of the 110 NIST 800-171 controls has a weighted point value — unimplemented controls subtract points. You need a positive score to qualify for DoD contracts. Kaelus calculates your live SPRS score against all 110 controls and shows you exactly which gaps cost you the most points.",
  },
  {
    keywords: ["cui", "controlled unclassified", "detect cui", "what is cui"],
    answer:
      "**CUI (Controlled Unclassified Information)** is sensitive government data that doesn't meet classified thresholds but still needs protection. Examples: contract numbers, CAGE codes, technical specs, FOUO markings, export-controlled data. Kaelus scans every AI prompt for 16+ CUI patterns in real-time, blocks leakage to ChatGPT/Copilot/Claude, and logs every detection to your audit trail.",
  },
  {
    keywords: ["install", "setup", "integrate", "how to use", "get started", "quickstart", "base url", "gateway"],
    answer:
      "**One line of code** — change your AI API base URL:\n\n```\nbaseURL: 'https://gateway.kaelus.online/v1'\n```\n\nWorks with OpenAI SDK, LangChain, LlamaIndex, and any HTTP client. Supports ChatGPT, Copilot, Claude, Gemini, and 800+ models via OpenRouter. Takes under 15 minutes. No agents to install, no firewall rules, no user training.",
  },
  {
    keywords: ["hipaa", "phi", "health", "medical", "protected health", "healthcare"],
    answer:
      "Kaelus detects all **18 HIPAA Safe Harbor PHI identifiers**: SSNs, DOBs, phone numbers, medical record IDs, device identifiers, IP addresses, and more. When your team pastes patient data into ChatGPT or Copilot, Kaelus blocks it before it reaches the AI provider, logs the incident, and generates a HIPAA-compliant audit report.",
  },
  {
    keywords: ["soc 2", "soc2", "type ii", "audit", "trust services"],
    answer:
      "For **SOC 2**, Kaelus covers the Security and Confidentiality trust service criteria around AI data handling. It prevents unauthorized disclosure of customer data through AI tools, maintains an immutable audit trail with SHA-256 hash chain, and provides exportable reports for your SOC 2 auditor.",
  },
  {
    keywords: ["price", "pricing", "cost", "free", "pro", "enterprise", "tier", "plan"],
    answer:
      "**Kaelus pricing:**\n- **Free** — 100 scans/mo, SPRS assessment, 7-day log retention\n- **Pro** ($199/mo) — Unlimited scans, API access, 90-day logs\n- **Growth** ($499/mo) — PDF reports, team seats, priority support\n- **Enterprise** ($999/mo) — SSO, SIEM integration, SLA\n- **Agency** ($2,499/mo) — Multi-tenant, white-label, MSP billing\n\nStart free at kaelus.online — no credit card required.",
  },
  {
    keywords: ["detect", "scan", "patterns", "what can you", "what do you detect", "capabilities"],
    answer:
      "Kaelus scans for **16+ sensitive patterns** in under 10ms:\n- API keys & tokens (OpenAI, AWS, GitHub, Stripe...)\n- PII: SSNs, credit cards, passports, drivers licenses\n- PHI: all 18 HIPAA Safe Harbor identifiers\n- CUI: contract numbers, CAGE codes, FOUO, clearance levels\n- IP: source code patterns, trade secrets\n- Financial: bank accounts, routing numbers, IBAN\n\nAll detection happens locally — your data never leaves your network for scanning.",
  },
  {
    keywords: ["blockchain", "audit trail", "tamper", "immutable", "hash"],
    answer:
      "Every compliance event is logged with a **SHA-256 hash chain** — each event includes the hash of the previous, creating a tamper-evident audit trail. Critical events are anchored to **Base L2 blockchain**, providing cryptographic proof that logs weren't altered. This satisfies CMMC AC.3.022 and DoD audit requirements.",
  },
  {
    keywords: ["slack", "teams", "alert", "notification", "webhook"],
    answer:
      "Kaelus sends real-time alerts to **Slack** (Block Kit cards with severity colors) and **Microsoft Teams** (Adaptive Cards v1.5). CRITICAL events route to your security channel instantly. You can also configure SIEM forwarding to Splunk, Azure Sentinel, or Elastic for SOC integration.",
  },
  {
    keywords: ["latency", "performance", "slow", "speed", "10ms", "fast"],
    answer:
      "Kaelus adds **under 10ms** to every AI request. The compliance engine uses:\n- Pre-sorted regex patterns (CRITICAL first → short-circuit on first match)\n- 256-entry LRU cache with 5-min TTL — repeated patterns cost ~1µs\n- Sliding window scanner: 500-char windows, 256-char overlap\n- Stream scanning: compliance runs while tokens stream, not after\n\nYour users notice zero difference in response time.",
  },
  {
    keywords: ["mcp", "model context protocol", "claude desktop", "mcp server"],
    answer:
      "Kaelus exposes an **MCP Server endpoint** that integrates with Claude Desktop, Cursor, and any MCP-compatible client. Set the Kaelus gateway as your MCP proxy and every tool call passes through compliance scanning automatically. This is the highest-value enterprise integration — contact us for early access.",
  },
];

/**
 * Score a query against a FAQ entry using keyword overlap.
 * Returns 0–1 (higher = better match).
 */
function scoreEntry(query: string, entry: FaqEntry): number {
  const q = query.toLowerCase();
  let hits = 0;
  for (const kw of entry.keywords) {
    if (q.includes(kw)) hits++;
  }
  // Normalize by keyword count to avoid bias toward long keyword lists
  return hits / entry.keywords.length;
}

/**
 * Find the best FAQ answer for a given query.
 * Returns null if no entry scores above the confidence threshold.
 */
export function findFaqAnswer(query: string, threshold = 0.15): string | null {
  let best: { score: number; answer: string } | null = null;

  for (const entry of FAQ_DB) {
    const score = scoreEntry(query, entry);
    if (score > (best?.score ?? 0)) {
      best = { score, answer: entry.answer };
    }
  }

  if (!best || best.score < threshold) return null;
  return best.answer;
}
