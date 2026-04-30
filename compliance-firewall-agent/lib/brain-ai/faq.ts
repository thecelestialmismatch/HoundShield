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
 *  3. Return null if confidence < threshold — caller falls back to LLM
 *
 * Knowledge sources integrated (2026-04-11):
 *  - Anthropic Managed Agents blog
 *  - Claude Code optimization techniques (model routing, context, CLAUDE.md)
 *  - Goose / Agentscope multi-agent frameworks
 *  - OpenRouter Qwen 3 free models
 *  - Context-Mode plugin (50-90% token reduction)
 *  - Self-evolving hooks pattern (buildthisnow.com)
 *  - MOSS-VL multimodal architecture patterns
 *  - CopilotKit codebase navigation patterns
 *  - Hound Shield product (full coverage of all features, verticals, pricing)
 */

export interface FaqEntry {
  keywords: string[];
  answer: string;
}

const FAQ_DB: FaqEntry[] = [
  // ── PRODUCT IDENTITY ────────────────────────────────────────────────
  {
    keywords: ["what is houndshield", "houndshield", "what does it do", "explain houndshield", "overview", "product", "firewall"],
    answer:
      "**Hound Shield** is an AI compliance firewall — a single proxy URL that sits between your team and every AI provider. Change one line of code:\n\n```\nbaseURL: 'https://gateway.houndshield.com/v1'\n```\n\nEvery prompt (ChatGPT, Copilot, Claude, Gemini, 800+ models) is scanned in **under 10ms** across 16 risk categories. CUI, PHI, API keys, PII — all detected and blocked before they reach the AI. SOC 2, HIPAA, and CMMC Level 2 enforced simultaneously on every request.",
  },
  {
    keywords: ["how does houndshield work", "architecture", "proxy", "intercept", "mechanism", "how it works"],
    answer:
      "Hound Shield acts as a **transparent proxy gateway**:\n\n1. Your team's AI tools point to `gateway.houndshield.com/v1` instead of OpenAI/Anthropic\n2. Every prompt passes through the 16-engine detection matrix (<10ms)\n3. PASS: forwarded to 800+ models via OpenRouter\n4. BLOCK: rejected with compliance reason\n5. QUARANTINE: AES-256 encrypted, routed to human reviewer\n\nThe stream output is also scanned token-by-token — if an LLM starts generating a credit card number mid-response, it's truncated before delivery.",
  },

  // ── CMMC ────────────────────────────────────────────────────────────
  {
    keywords: ["cmmc", "level 2", "cmmc 2", "cybersecurity maturity", "what is cmmc"],
    answer:
      "**CMMC Level 2** requires US defense contractors to implement all **110 NIST 800-171 Rev 2 controls**. It protects Controlled Unclassified Information (CUI) across your supply chain. Enforcement begins November 2026 — you'll need a certified C3PAO assessment ($30K–$150K) or a self-assessment with a SPRS score filed in SPRS. Hound Shield automates your SPRS scoring, detects CUI in every AI prompt, and generates audit-ready reports.",
  },
  {
    keywords: ["sprs", "score", "sprs score", "scoring", "points", "110 points"],
    answer:
      "**SPRS (Supplier Performance Risk System)** is where you file your CMMC self-assessment score. It ranges from **−203 to +110**. Each of the 110 NIST 800-171 controls has a weighted point value — unimplemented controls subtract points. You need a positive score to qualify for DoD contracts. Hound Shield calculates your live SPRS score against all 110 controls and shows you exactly which gaps cost you the most points.",
  },
  {
    keywords: ["cui", "controlled unclassified", "detect cui", "what is cui"],
    answer:
      "**CUI (Controlled Unclassified Information)** is sensitive government data that doesn't meet classified thresholds but still needs protection. Examples: contract numbers, CAGE codes, technical specs, FOUO markings, export-controlled data. Hound Shield scans every AI prompt for 16+ CUI patterns in real-time, blocks leakage to ChatGPT/Copilot/Claude, and logs every detection to your audit trail.",
  },
  {
    keywords: ["november 2026", "enforcement", "deadline", "dod", "contract", "c3pao", "c3 pao", "assessment cost"],
    answer:
      "**November 2026** is the CMMC enforcement deadline — after that, DoD contracts require a verified CMMC Level 2 status. A C3PAO assessment costs **$30K–$150K** and rising. About 80,000–300,000 US contractors need CMMC Level 2. Only ~400 are currently certified. Hound Shield is the most affordable path: start free, get your SPRS score live on day one, and generate the evidence package a C3PAO needs — without a consultant.",
  },
  {
    keywords: ["nist", "nist 800-171", "800-171", "controls", "110 controls"],
    answer:
      "NIST SP 800-171 Rev 2 contains **110 security controls** across 14 domains: Access Control, Awareness, Audit, Configuration, Identification, Incident Response, Maintenance, Media Protection, Personnel, Physical, Risk Assessment, Security Assessment, Systems & Communications, and System Integrity. Hound Shield maps every AI intercept to the relevant controls and shows your live SPRS impact per control domain.",
  },

  // ── HIPAA ────────────────────────────────────────────────────────────
  {
    keywords: ["hipaa", "phi", "health", "medical", "protected health", "healthcare", "patient"],
    answer:
      "Hound Shield detects all **18 HIPAA Safe Harbor PHI identifiers**: SSNs, DOBs, phone numbers, medical record IDs, device identifiers, IP addresses, and more. When your team pastes patient data into ChatGPT or Copilot, Hound Shield blocks it before it reaches the AI provider, logs the incident, and generates a HIPAA-compliant audit report.",
  },

  // ── SOC 2 ────────────────────────────────────────────────────────────
  {
    keywords: ["soc 2", "soc2", "type ii", "audit", "trust services", "aicpa"],
    answer:
      "For **SOC 2**, Hound Shield covers the Security and Confidentiality trust service criteria around AI data handling. It prevents unauthorized disclosure of customer data through AI tools, maintains an immutable audit trail with SHA-256 hash chain, and provides exportable reports for your SOC 2 auditor.",
  },

  // ── INSTALLATION ────────────────────────────────────────────────────
  {
    keywords: ["install", "setup", "integrate", "how to use", "get started", "quickstart", "base url", "gateway", "onboard", "how do i install", "how to install", "deploy hound shield", "start hound shield"],
    answer:
      "**One line of code** — change your AI API base URL:\n\n```\nbaseURL: 'https://gateway.houndshield.com/v1'\n```\n\nWorks with OpenAI SDK, LangChain, LlamaIndex, and any HTTP client. Supports ChatGPT, Copilot, Claude, Gemini, and 800+ models via OpenRouter. Takes under 15 minutes. No agents to install, no firewall rules, no user training.",
  },
  {
    keywords: ["python", "langchain", "openai sdk", "sdk", "node", "curl", "integration example"],
    answer:
      "```python\n# Python / LangChain\nclient = OpenAI(\n  base_url='https://gateway.houndshield.com/v1',\n  api_key=os.environ['OPENAI_API_KEY']\n)\n```\n\n```typescript\n// Node.js / TypeScript\nconst openai = new OpenAI({\n  baseURL: 'https://gateway.houndshield.com/v1',\n  apiKey: process.env.OPENAI_API_KEY,\n});\n```\n\nAny OpenAI-compatible client works. Use any model slug (gpt-4o, claude-sonnet-4-6, gemini-flash, llama-3.3...) — Hound Shield routes to OpenRouter's 800+ model catalog.",
  },
  {
    keywords: ["docker", "self-host", "on-prem", "air-gap", "self hosted", "local", "on premises"],
    answer:
      "**Self-host in minutes:**\n\n```bash\ngit clone https://github.com/thecelestialmismatch/Hound Shield.git\ncd Hound Shield/compliance-firewall-agent\ncp .env.example .env  # fill required values\ndocker compose up -d\n```\n\nDashboard and gateway start at `http://localhost:3000`. Multi-stage Docker build, non-root user, health checks included. For full air-gap: add `OLLAMA_BASE_URL` for local model serving.",
  },

  // ── PRICING ──────────────────────────────────────────────────────────
  {
    keywords: ["price", "pricing", "cost", "free", "pro", "enterprise", "tier", "plan", "how much"],
    answer:
      "**Hound Shield pricing:**\n- **Starter** (Free) — 1,000 scans/mo, dashboard, 16-engine detection\n- **Pro** ($199/mo) — 50K scans, SOC 2 + HIPAA, Slack + Teams alerts\n- **Growth** ($499/mo) — 250K scans, CMMC L2, SIEM connectors, PDF reports\n- **Enterprise** ($999/mo) — Unlimited, blockchain anchoring, white-label, on-prem\n- **Agency/MSP** ($2,499/mo) — Multi-tenant, full platform resale\n\nAll paid plans include a 14-day free trial. Start free at houndshield.com.",
  },

  // ── DETECTION ────────────────────────────────────────────────────────
  {
    keywords: ["detect", "scan", "patterns", "what can you", "what do you detect", "capabilities", "16 engines", "categories"],
    answer:
      "Hound Shield scans for **16+ sensitive patterns** in under 10ms:\n- API keys & tokens (OpenAI, AWS, GitHub, Stripe...)\n- PII: SSNs, credit cards, passports, drivers licenses\n- PHI: all 18 HIPAA Safe Harbor identifiers\n- CUI: contract numbers, CAGE codes, FOUO, clearance levels\n- IP: source code patterns, trade secrets\n- Financial: bank accounts, routing numbers, IBAN\n\nAll detection happens locally — your data never leaves your network for scanning.",
  },
  {
    keywords: ["false positive", "false alarm", "accuracy", "precision", "block everything"],
    answer:
      "Hound Shield uses a **hybrid detection approach** to minimize false positives:\n1. Regex patterns sorted by severity (CRITICAL-first, short-circuit on first hit)\n2. LRU cache (256 entries, 5-min TTL) — repeated safe content costs ~1µs\n3. Gemini Flash ML scan for context-aware classification\n4. Confidence scoring — low-confidence matches go to REVIEW, not BLOCK\n\nYou can also set per-team risk thresholds: strict for defense teams, lenient for marketing.",
  },

  // ── PERFORMANCE / LATENCY ─────────────────────────────────────────────
  {
    keywords: ["latency", "performance", "slow", "speed", "10ms", "fast", "overhead"],
    answer:
      "Hound Shield adds **under 10ms** to every AI request. The compliance engine uses:\n- Pre-sorted regex patterns (CRITICAL first — short-circuit on first match)\n- 256-entry LRU cache with 5-min TTL — repeated patterns cost ~1µs\n- Sliding window scanner: 500-char windows, 256-char overlap\n- Stream scanning: compliance runs while tokens stream, not after\n\nYour users notice zero difference in response time.",
  },

  // ── AUDIT / BLOCKCHAIN ───────────────────────────────────────────────
  {
    keywords: ["blockchain", "audit trail", "tamper", "immutable", "hash", "base l2", "ledger"],
    answer:
      "Every compliance event is logged with a **SHA-256 hash chain** — each event includes the hash of the previous, creating a tamper-evident audit trail. Critical events are anchored to **Base L2 blockchain**, providing cryptographic proof that logs weren't altered. This satisfies CMMC AC.3.022 and DoD audit requirements.",
  },
  {
    keywords: ["pdf", "report", "export", "download", "generate report", "compliance report"],
    answer:
      "Hound Shield generates **one-click PDF compliance reports** covering:\n- SOC 2: AI data handling controls, audit evidence timeline\n- HIPAA: PHI detection events, breach risk summary\n- CMMC Level 2: SPRS score, 110-control gap analysis, remediation priorities\n\nReports are C3PAO-ready and include your company letterhead. Available on Growth+ plans. Generate from your dashboard at any time.",
  },

  // ── ALERTS / NOTIFICATIONS ───────────────────────────────────────────
  {
    keywords: ["slack", "teams", "alert", "notification", "webhook", "microsoft teams", "real-time"],
    answer:
      "Hound Shield sends real-time alerts to **Slack** (Block Kit cards with severity colors) and **Microsoft Teams** (Adaptive Cards v1.5). CRITICAL events route to your security channel instantly. You can also configure SIEM forwarding to Splunk, Azure Sentinel, or Elastic for SOC integration.",
  },
  {
    keywords: ["siem", "splunk", "sentinel", "elastic", "elasticsearch", "soc", "security operations"],
    answer:
      "**SIEM integrations available on Enterprise:**\n- **Splunk HEC**: NDJSON batch delivery, CIM-compatible fields, CEF format support\n- **Azure Sentinel**: HMAC-signed, KQL-queryable `Hound ShieldCompliance_CL` table\n- **Elastic/ELK**: Elastic Common Schema fields, Kibana-ready\n\nEvery compliance event ships with user ID, model used, risk level, entity types detected, and action taken (PASS/BLOCK/QUARANTINE).",
  },

  // ── MCP / DEVELOPER INTEGRATIONS ────────────────────────────────────
  {
    keywords: ["mcp", "model context protocol", "claude desktop", "mcp server", "cursor", "agent"],
    answer:
      "Hound Shield exposes an **MCP Server endpoint** that integrates with Claude Desktop, Cursor, and any MCP-compatible client. Set the Hound Shield gateway as your MCP proxy and every tool call passes through compliance scanning automatically. This is the highest-value enterprise integration — contact us for early access at info@houndshield.com.",
  },
  {
    keywords: ["api", "rest api", "api key", "programmatic", "developer", "v1", "api access"],
    answer:
      "**Hound Shield REST API v1** (`/api/v1/*`) lets MSPs and developers:\n- Query compliance events programmatically\n- Trigger scans via HTTP\n- Manage team API keys\n- Pull audit data into custom dashboards\n\nAPI access is available on Pro+ plans. Authentication: Bearer token in `x-api-key` header. Full OpenAPI spec coming Q2 2026.",
  },
  {
    keywords: ["managed agents", "anthropic", "claude managed", "hosted agents", "cloud agents"],
    answer:
      "Hound Shield supports **Anthropic Managed Agents** integration — composable cloud-hosted agent APIs that connect to the Hound Shield compliance gateway. When Claude agents make tool calls or fetch external data, Hound Shield intercepts and scans each request in real-time, providing compliance coverage for autonomous AI workflows, not just chat.",
  },
  {
    keywords: ["goose", "agentscope", "multi-agent", "agentic", "ai agent", "autonomous", "workflow"],
    answer:
      "Hound Shield integrates with **multi-agent frameworks** (Goose, AgentScope, AutoGen, LangGraph):\n\n1. Point the agent's LLM base URL to `gateway.houndshield.com/v1`\n2. Every agent tool call and LLM request is automatically scanned\n3. CUI/PHI leakage in agentic workflows is blocked before external exposure\n\nThis is critical for defense contractors running AI agents on documents containing CUI — the agent may autonomously forward sensitive data without user review.",
  },

  // ── MODEL ACCESS ─────────────────────────────────────────────────────
  {
    keywords: ["models", "800 models", "gpt-4", "claude", "gemini", "llama", "qwen", "openrouter", "what models"],
    answer:
      "Hound Shield provides access to **800+ models via OpenRouter** through a single compliant endpoint:\n- OpenAI: GPT-4o, o3, o1\n- Anthropic: Claude 4.6 Sonnet, Claude 3.5 Haiku\n- Google: Gemini 2.5 Pro/Flash\n- Meta: Llama 3.3 70B\n- Qwen: Qwen3 (including free tiers)\n- Mistral: Large, Codestral\n- 800+ more\n\nAll models, all compliant. Use the model slug as the `model` parameter — Hound Shield routes to the right provider automatically.",
  },

  // ── INDUSTRIES / VERTICALS ───────────────────────────────────────────
  {
    keywords: ["defense", "contractor", "dod", "military", "government", "federal"],
    answer:
      "For **defense contractors**, Hound Shield is the most direct path to CMMC compliance:\n- Live SPRS score across all 110 NIST controls\n- CUI detection: FOUO, CAGE codes, contract numbers, clearance levels, ITAR/EAR\n- Audit evidence package for C3PAO assessors\n- November 2026 deadline: ~80,000 contractors need this\n- Starting at FREE — no budget needed to start your assessment",
  },
  {
    keywords: ["healthcare", "hospital", "clinic", "ehr", "electronic health", "medical records"],
    answer:
      "For **healthcare**, Hound Shield prevents HIPAA violations when clinical staff use AI:\n- Blocks all 18 PHI identifiers before reaching ChatGPT, Copilot, or Claude\n- HIPAA-compliant logging (SHA-256 hashed, no PHI in plaintext)\n- BAA available on Growth+\n- Works with Epic, Cerner, Epic MyChart workflows — no EHR changes needed\n- Zero-latency to clinical workflows (<10ms overhead)",
  },
  {
    keywords: ["law firm", "legal", "attorney", "privilege", "m&a", "finance", "bank"],
    answer:
      "For **legal and finance**, Hound Shield protects:\n- Attorney-client privileged communications\n- M&A deal terms, target companies, valuations\n- PCI-DSS card numbers, IBAN, routing numbers\n- Non-public MNPI in investment banking\n\nEvery AI-assisted document review, contract analysis, or financial modeling session is logged with full audit evidence for your compliance team.",
  },

  // ── SECURITY ARCHITECTURE ────────────────────────────────────────────
  {
    keywords: ["security", "encryption", "aes", "vault", "quarantine", "data privacy", "store data"],
    answer:
      "**Hound Shield security architecture:**\n- Prompt text never stored in plaintext — SHA-256 hashed only\n- AES-256 encryption for quarantined prompts\n- All secrets in environment variables — never hardcoded\n- Non-root Docker user (nextjs:nodejs)\n- Rate limiting at middleware layer (60 req/min default)\n- HMAC-SHA256 for all outbound SIEM requests\n- Base L2 blockchain for tamper-proof audit evidence\n\nYour data never leaves your network for scanning — the detection engine runs in your environment.",
  },

  // ── COMPARISON / COMPETITORS ─────────────────────────────────────────
  {
    keywords: ["versus", "vs", "compare", "alternative", "competitor", "dlp", "data loss", "prisma"],
    answer:
      "**Hound Shield vs. traditional DLP:**\n| | Traditional DLP | Hound Shield |\n|---|---|---|\n| Deployment | Weeks, agents on every device | 15 min, one URL change |\n| AI models covered | Block AI entirely | 800+ models, all compliant |\n| Frameworks | One at a time | SOC 2 + HIPAA + CMMC simultaneously |\n| Latency | Seconds (inline inspection) | <10ms |\n| SPRS scoring | Not supported | Live, all 110 controls |\n| Cost | $50K+/year enterprise licenses | From free |",
  },

  // ── SUPPORT / CONTACT ────────────────────────────────────────────────
  {
    keywords: ["contact", "support", "email", "help", "talk to", "sales", "demo", "team"],
    answer:
      "**Get in touch:**\n- Website: [houndshield.com](https://houndshield.com)\n- Email: info@houndshield.com\n- Docs: houndshield.com/docs\n- Pricing: houndshield.com/pricing\n\nFor enterprise demos, MSP partnerships, or C3PAO coordination, email directly — we typically respond same day.",
  },

  // ── ROADMAP ──────────────────────────────────────────────────────────
  {
    keywords: ["roadmap", "coming soon", "future", "planned", "next", "upcoming", "browser extension", "mobile"],
    answer:
      "**Hound Shield roadmap (2026):**\n- [ ] Browser extension (Chrome/Edge) — intercept browser-native AI tools\n- [ ] Mobile app (iOS + Android) — dashboard + push alerts\n- [ ] Ollama/local model support — full air-gap mode\n- [ ] SAML/SSO — Okta, Azure AD, JumpCloud\n- [ ] Custom pattern library — org-specific regex + ML rules\n- [ ] Zero-trust mode — deny by default, allowlist per team\n- [ ] Elastic SIEM connector\n\nAlready shipped: gateway, 16-engine detection, blockchain audit, Slack/Teams/Splunk/Sentinel, PDF reports, Docker deploy.",
  },

  // ── AI TOOL OPTIMIZATION (for developers using Hound Shield with Claude Code etc.) ─
  {
    keywords: ["claude code", "optimize", "token", "cost", "model routing", "haiku", "sonnet", "opus"],
    answer:
      "**Optimizing your AI tool costs:**\n- Use **Haiku** for quick lookups, formatting, renaming tasks\n- Use **Sonnet** for most daily work — tests, edits, explanations\n- Use **Opus** only for complex multi-file refactors and architecture decisions\n\nHound Shield integrates with Claude Code directly: set `gateway.houndshield.com/v1` as your base URL to get compliance scanning on every IDE AI request — including Copilot completions.",
  },
  {
    keywords: ["context window", "context", "token usage", "mcp tokens", "clear context"],
    answer:
      "**Reducing AI context costs:**\n- Clear context between unrelated tasks — stale context increases cost and reduces quality\n- CLI tools consume far fewer tokens than MCP servers (prefer `gh` CLI over GitHub MCP)\n- Keep CLAUDE.md/system prompts under 2,000 tokens — they're injected on EVERY request\n- Use file path references instead of inlining large documents\n\nHound Shield's MCP integration also helps: raw tool output is summarized before entering your context.",
  },
];

/**
 * Score a query against a FAQ entry using keyword overlap.
 * Returns 0–1 (higher = better match).
 *
 * Normalization: divide by 40% of keyword count (rounded up), not 100%.
 * This prevents entries with many synonyms from being unfairly penalised
 * when the user's query only contains one or two of them.
 * Example: 1 hit out of 13 keywords → 1/ceil(13*0.4) = 1/6 ≈ 0.17 (passes 0.15 threshold).
 */
function scoreEntry(query: string, entry: FaqEntry): number {
  const q = query.toLowerCase();
  let hits = 0;
  for (const kw of entry.keywords) {
    if (q.includes(kw)) hits++;
  }
  if (hits === 0) return 0;
  const divisor = Math.max(1, Math.ceil(entry.keywords.length * 0.4));
  return Math.min(1, hits / divisor);
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
