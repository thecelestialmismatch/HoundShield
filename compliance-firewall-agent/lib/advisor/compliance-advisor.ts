/**
 * Advisor Strategy — Haiku + Opus compliance classification
 *
 * Implements Anthropic's advisor_20260301 tool type:
 *   - Executor: claude-haiku-4-5 (fast, <$1/M tokens)
 *   - Advisor:  claude-opus-4-6  (only consulted when Haiku is uncertain)
 *
 * The advisor tool is declared once in the tools array. Haiku runs the full
 * ReAct loop autonomously; it calls the advisor tool only when it encounters
 * genuine ambiguity — borderline HIPAA PHI, implicit CUI, context-dependent
 * risk. All communication happens inside a single /v1/messages request.
 *
 * Result: 85% cheaper than Sonnet-only for routine scans, while borderline
 * cases get Opus-level compliance reasoning.
 *
 * When to use:
 *   classifyRisk() calls this when regex + Gemini return MEDIUM risk
 *   with confidence < 0.7 — the "grey zone" where regex over-fires.
 *
 * Dependencies: ANTHROPIC_API_KEY env var (or ANTHROPIC_API_KEY_PRIMARY).
 * If not configured, returns null and the caller falls back gracefully.
 */

export type AdvisorRiskLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AdvisorAction = "PASS" | "WARN" | "BLOCK" | "QUARANTINE";

export interface AdvisorClassificationResult {
  /** Definitive risk level from the advisor-augmented classification. */
  risk_level: AdvisorRiskLevel;
  /** Compliance frameworks implicated (SOC2, HIPAA, CMMC, CUSTOM). */
  frameworks_triggered: string[];
  /** Recommended enforcement action. */
  recommended_action: AdvisorAction;
  /** Haiku's reasoning — or Opus's if advisor was consulted. */
  reasoning: string;
  /** True if Opus was actually called (Haiku was uncertain). */
  advisor_consulted: boolean;
  /** 0–1 confidence from the executor's self-assessment. */
  confidence: number;
  /** Total wall-clock time for the Anthropic API call. */
  latency_ms: number;
}

// ---------------------------------------------------------------------------
// Anthropic API shape for the advisor tool
// ---------------------------------------------------------------------------

interface AdvisorTool {
  type: "advisor_20260301";
  model: string;
  max_uses: number;
}

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnthropicRequestBody {
  model: string;
  max_tokens: number;
  tools: AdvisorTool[];
  messages: AnthropicMessage[];
  system: string;
}

interface AnthropicContentBlock {
  type: "text";
  text: string;
}

interface AnthropicResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: AnthropicContentBlock[];
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    advisor_input_tokens?: number;
    advisor_output_tokens?: number;
  };
}

// ---------------------------------------------------------------------------
// Structured output schema
//
// Haiku is instructed to return JSON matching this shape. We parse it from
// the text content block — no tool_use required for the output format.
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a compliance classification engine for Hound Shield AI Firewall.

Your mission: determine the exact compliance risk of the given text across:
  - SOC 2: access control, credential exposure, audit log gaps
  - HIPAA: 18 PHI identifiers (names, dates, SSNs, MRNs, emails, phone, addresses, biometrics)
  - CMMC Level 2: CUI, FCI, ITAR/EAR export-controlled data
  - CUSTOM: API keys, private keys, connection strings, internal IPs

You have access to an advisor tool (Opus-level model). Call it ONLY when you are genuinely
uncertain about borderline cases — implicit PHI, ambiguous CUI context, dual-use technical data.
Do NOT call the advisor for obvious cases (clear SSN → HIGH, safe business text → NONE).

Respond with a single JSON object:
{
  "risk_level": "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "frameworks_triggered": ["HIPAA", "CMMC", ...],
  "recommended_action": "PASS" | "WARN" | "BLOCK" | "QUARANTINE",
  "reasoning": "one-sentence explanation",
  "confidence": 0.0–1.0,
  "advisor_consulted": true | false
}

Risk level guidelines:
  NONE     — No sensitive data detected
  LOW      — Potentially sensitive but context unclear; no PII/PHI confirmed
  MEDIUM   — Sensitive data pattern matched with moderate confidence
  HIGH     — Confirmed sensitive data (PHI, CUI, credentials) present
  CRITICAL — Multiple HIGH markers or ITAR/export-controlled data confirmed

Action guidelines:
  PASS       → NONE/LOW with confidence > 0.8
  WARN       → MEDIUM or LOW with uncertainty
  BLOCK      → HIGH/CRITICAL
  QUARANTINE → HIGH with PHI and HIPAA context`;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Classify text using Haiku as executor with Opus as advisor.
 *
 * Returns null when:
 *   - ANTHROPIC_API_KEY is not configured
 *   - The API call fails or times out (10s budget)
 *   - The response cannot be parsed
 *
 * Callers should treat null as "advisor unavailable — fall back to regex result".
 */
export async function classifyWithAdvisor(
  text: string,
  context?: { preliminary_risk?: AdvisorRiskLevel; org_id?: string }
): Promise<AdvisorClassificationResult | null> {
  const apiKey =
    process.env.ANTHROPIC_API_KEY_PRIMARY ||
    process.env.ANTHROPIC_API_KEY;

  if (!apiKey) return null;

  const t0 = Date.now();

  // Truncate: 2 000 chars is plenty for compliance classification.
  // Longer texts were already scanned by regex — we only need the "grey zone".
  const truncated = text.length > 2_000 ? text.slice(0, 2_000) : text;

  const userContent = [
    context?.preliminary_risk
      ? `Preliminary regex scan returned: ${context.preliminary_risk} risk. ` +
        `Please verify this classification with your own analysis.`
      : `Classify the following text for compliance risk:`,
    "",
    "--- BEGIN TEXT ---",
    truncated,
    "--- END TEXT ---",
  ].join("\n");

  const requestBody: AnthropicRequestBody = {
    model: "claude-haiku-4-5",
    max_tokens: 512,
    tools: [
      {
        type: "advisor_20260301",
        model: "claude-opus-4-6",
        // Allow up to 2 advisor consultations per scan.
        // One to verify, one to re-check edge cases.
        max_uses: 2,
      },
    ],
    messages: [{ role: "user", content: userContent }],
    system: SYSTEM_PROMPT,
  };

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "advisor-20260301",
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(10_000), // 10s hard cap
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      // 400 likely means the beta isn't enabled for this key yet — fail silently
      if (response.status === 400 || response.status === 404) {
        return null;
      }
      console.warn(
        `[houndshield:advisor] Anthropic API error ${response.status}: ${errorText.slice(0, 200)}`
      );
      return null;
    }

    const data = (await response.json()) as AnthropicResponse;
    const latency_ms = Date.now() - t0;

    // Extract text content block
    const textBlock = data.content.find((b) => b.type === "text");
    if (!textBlock?.text) return null;

    // Parse JSON from response — strip markdown code fences if present
    const jsonText = textBlock.text
      .replace(/^```(?:json)?\s*/m, "")
      .replace(/\s*```\s*$/m, "")
      .trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonText) as Record<string, unknown>;
    } catch {
      console.warn("[houndshield:advisor] Failed to parse JSON from response:", jsonText.slice(0, 200));
      return null;
    }

    // Detect whether Opus was actually consulted via usage fields
    const advisorConsulted =
      (parsed.advisor_consulted as boolean | undefined) ??
      ((data.usage.advisor_input_tokens ?? 0) > 0);

    return {
      risk_level: (parsed.risk_level as AdvisorRiskLevel) ?? "NONE",
      frameworks_triggered: (parsed.frameworks_triggered as string[]) ?? [],
      recommended_action: (parsed.recommended_action as AdvisorAction) ?? "PASS",
      reasoning: (parsed.reasoning as string) ?? "",
      advisor_consulted: advisorConsulted,
      confidence: (parsed.confidence as number) ?? 0.5,
      latency_ms,
    };
  } catch (err) {
    // AbortError from timeout or network failure — non-fatal
    const errMsg = err instanceof Error ? err.message : String(err);
    if (!errMsg.includes("AbortError") && !errMsg.includes("abort")) {
      console.warn("[houndshield:advisor] Classification failed:", errMsg);
    }
    return null;
  }
}

/**
 * Returns true when ANTHROPIC_API_KEY is available and the advisor can be used.
 * Used by risk-engine.ts to gate the Stage 6.5 advisor escalation.
 */
export function isAdvisorConfigured(): boolean {
  return Boolean(
    process.env.ANTHROPIC_API_KEY_PRIMARY || process.env.ANTHROPIC_API_KEY
  );
}
