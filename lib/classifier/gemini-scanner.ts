/**
 * Gemini Flash Intent-Based Scanner
 *
 * Uses Gemini 2.0 Flash (via the Generative Language API) for context-aware
 * PII leak detection, trade secret patterns, and proprietary code detection
 * that regex-based rules miss.
 *
 * Architecture decisions:
 *   - Hard 10ms inference budget enforced via AbortSignal.timeout(10).
 *     If Gemini Flash exceeds this, the call is aborted and the caller falls
 *     back to regex scanning immediately. No blocking.
 *   - The prompt is truncated to 1500 chars before sending to minimize
 *     network round-trip time. Most leaks appear in the first few hundred
 *     characters.
 *   - The response is a structured JSON payload parsed in <1ms.
 *   - This module is stateless and side-effect-free. The caller owns logging.
 *
 * Environment variable required:
 *   GEMINI_API_KEY  - Google AI Studio API key (free tier: 15 RPM, 1M TPM)
 *
 * Fallback: if GEMINI_API_KEY is not set, the module returns null instantly.
 */

export interface GeminiScanResult {
  is_sensitive: boolean;
  risk_level: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  detected_categories: string[];
  reasoning: string;
  inference_ms: number;
  model: "gemini-flash";
}

// ---------------------------------------------------------------------------
// Prompt engineering
// ---------------------------------------------------------------------------

const SYSTEM_INSTRUCTION = `You are a compliance firewall scanner. Analyze the text for:
1. PII (names, SSNs, emails, phone numbers, addresses, dates of birth)
2. Trade secrets (proprietary algorithms, business strategies, internal projects)
3. Credentials (API keys, passwords, tokens, private keys)
4. PHI (medical records, diagnoses, prescriptions, patient identifiers)
5. Financial data (credit cards, bank accounts, PINs, financial projections)
6. Proprietary code (internal function names, internal API endpoints, database schemas with sensitive data)

Respond ONLY with valid JSON, no markdown, no explanation:
{
  "is_sensitive": boolean,
  "risk_level": "NONE"|"LOW"|"MEDIUM"|"HIGH"|"CRITICAL",
  "detected_categories": string[],
  "reasoning": "one sentence, max 100 chars"
}`;

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";

// Hard inference budget. If we exceed this, we fall back to regex.
const INFERENCE_BUDGET_MS = 10;

// Maximum text to send. Keeps the payload small for speed.
const MAX_TEXT_LENGTH = 1_500;

// ---------------------------------------------------------------------------
// Scanner function
// ---------------------------------------------------------------------------

/**
 * Scans text using Gemini Flash for context-aware sensitive data detection.
 *
 * Returns null when:
 *   - GEMINI_API_KEY is not set
 *   - The 10ms budget is exceeded (AbortError)
 *   - Any network or parse error occurs
 *
 * Callers MUST handle null and fall back to regex scanning.
 */
export async function scanWithGeminiFlash(
  text: string
): Promise<GeminiScanResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  // Truncate to keep round-trip fast
  const truncated =
    text.length > MAX_TEXT_LENGTH ? text.slice(0, MAX_TEXT_LENGTH) : text;

  const start = performance.now();

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: `Scan this text:\n\n${truncated}` }],
          },
        ],
        generationConfig: {
          // Deterministic output for compliance consistency
          temperature: 0,
          maxOutputTokens: 200,
          responseMimeType: "application/json",
        },
      }),
      // Hard 10ms budget. The AbortError is caught below and returns null.
      signal: AbortSignal.timeout(INFERENCE_BUDGET_MS),
    });

    const inferenceMs = Math.round(performance.now() - start);

    if (!response.ok) {
      console.warn(`[gemini-scanner] API error ${response.status} — falling back to regex`);
      return null;
    }

    const data = await response.json();

    // Extract the text content from Gemini's response structure
    const rawText: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) return null;

    // Parse the structured JSON response
    let parsed: {
      is_sensitive?: boolean;
      risk_level?: string;
      detected_categories?: string[];
      reasoning?: string;
    };

    try {
      // Strip any accidental markdown fences
      const clean = rawText.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      console.warn("[gemini-scanner] JSON parse failed — falling back to regex");
      return null;
    }

    const validRiskLevels = ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const riskLevel = validRiskLevels.includes(parsed.risk_level ?? "")
      ? (parsed.risk_level as GeminiScanResult["risk_level"])
      : "NONE";

    return {
      is_sensitive: Boolean(parsed.is_sensitive),
      risk_level: riskLevel,
      detected_categories: Array.isArray(parsed.detected_categories)
        ? parsed.detected_categories.filter((c): c is string => typeof c === "string")
        : [],
      reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning.slice(0, 200) : "",
      inference_ms: inferenceMs,
      model: "gemini-flash",
    };
  } catch (err) {
    const inferenceMs = Math.round(performance.now() - start);

    if (err instanceof DOMException && err.name === "AbortError") {
      // Expected: budget exceeded. Fall back silently.
      console.warn(`[gemini-scanner] Budget exceeded (${inferenceMs}ms > ${INFERENCE_BUDGET_MS}ms) — regex fallback`);
    } else {
      console.warn("[gemini-scanner] Unexpected error — regex fallback:", err);
    }

    return null;
  }
}

/**
 * Returns true if Gemini Flash is configured and should be attempted.
 */
export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}
