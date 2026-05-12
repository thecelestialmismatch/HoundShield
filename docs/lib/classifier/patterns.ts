import type { RuleCategory, RiskLevel, RuleAction } from "@/lib/supabase/types";
import { CMMC_PATTERNS } from "./cmmc-patterns";
import { HIPAA_PATTERNS } from "./hipaa-patterns";

/**
 * Built-in detection patterns.
 *
 * These are compiled once at module load and reused across requests.
 * They serve as the fallback when the Supabase policy_rules table is
 * unavailable (e.g. during cold start or network partition).
 *
 * The patterns are intentionally conservative — false negatives are
 * worse than false positives for a compliance tool. False positives
 * get caught by the quarantine review process.
 */

export interface DetectionPattern {
  name: string;
  category: RuleCategory;
  regex: RegExp;
  risk_level: RiskLevel;
  action: RuleAction;
}

export const BUILTIN_PATTERNS: DetectionPattern[] = [
  // ── PII ──────────────────────────────────────────────
  {
    name: "Email addresses",
    category: "PII",
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    risk_level: "MEDIUM",
    action: "QUARANTINE",
  },
  {
    name: "US Social Security Numbers",
    category: "PII",
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    risk_level: "CRITICAL",
    action: "BLOCK",
  },
  {
    name: "Phone numbers (US)",
    category: "PII",
    regex: /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    risk_level: "MEDIUM",
    action: "QUARANTINE",
  },
  {
    name: "Credit card numbers",
    category: "PII",
    regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    risk_level: "CRITICAL",
    action: "BLOCK",
  },
  {
    name: "Date of birth patterns",
    category: "PII",
    regex: /\b(?:DOB|date of birth|born on|birthday)\s*[:=]?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/gi,
    risk_level: "HIGH",
    action: "BLOCK",
  },

  // ── FINANCIAL ────────────────────────────────────────
  {
    name: "Revenue / earnings figures",
    category: "FINANCIAL",
    regex: /(?:revenue|earnings|profit|loss|ebitda|arpu|mrr|arr)\s*[:=]?\s*\$?\d[\d,.]*[MBKmk]?\b/gi,
    risk_level: "HIGH",
    action: "BLOCK",
  },
  {
    name: "Bank routing numbers",
    category: "FINANCIAL",
    regex: /\b(?:routing|ABA)\s*(?:number|#|no\.?)?\s*[:=]?\s*\d{9}\b/gi,
    risk_level: "HIGH",
    action: "BLOCK",
  },
  {
    name: "Account numbers",
    category: "FINANCIAL",
    regex: /\b(?:account|acct)\s*(?:number|#|no\.?)?\s*[:=]?\s*\d{8,17}\b/gi,
    risk_level: "HIGH",
    action: "QUARANTINE",
  },

  // ── STRATEGIC ────────────────────────────────────────
  {
    name: "M&A keywords",
    category: "STRATEGIC",
    regex: /\b(?:acquisition|merger|due diligence|letter of intent|LOI|term sheet|buyout|acqui-?hire)\b/gi,
    risk_level: "CRITICAL",
    action: "BLOCK",
  },
  {
    name: "Pricing strategy",
    category: "STRATEGIC",
    regex: /\b(?:pricing strategy|price increase|margin target|competitive pricing|price point)\b/gi,
    risk_level: "HIGH",
    action: "QUARANTINE",
  },
  {
    name: "Roadmap references",
    category: "STRATEGIC",
    regex: /\b(?:product roadmap|feature roadmap|strategic plan|go-to-market|GTM strategy)\b/gi,
    risk_level: "MEDIUM",
    action: "QUARANTINE",
  },

  // ── IP ───────────────────────────────────────────────
  {
    name: "API keys / tokens",
    category: "IP",
    regex: /(?:api[_-]?key|secret[_-]?key|access[_-]?token|bearer)\s*[:=]\s*["']?[\w\-]{20,}/gi,
    risk_level: "CRITICAL",
    action: "BLOCK",
  },
  {
    name: "Database connection strings",
    category: "IP",
    regex: /(?:mongodb|postgres|mysql|redis|amqp):\/\/[^\s]+/gi,
    risk_level: "CRITICAL",
    action: "BLOCK",
  },
  {
    name: "Private keys",
    category: "IP",
    regex: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/g,
    risk_level: "CRITICAL",
    action: "BLOCK",
  },
  {
    name: "AWS credentials",
    category: "IP",
    regex: /(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/g,
    risk_level: "CRITICAL",
    action: "BLOCK",
  },
  {
    name: "Source code markers",
    category: "IP",
    regex: /(?:(?:function|class|const|let|var|def|public|private)\s+\w+\s*(?:\(|=|{))/g,
    risk_level: "LOW",
    action: "ALLOW",
  },

  // ── CMMC / DEFENSE CONTRACTING ────────────────────────────────────────────
  ...CMMC_PATTERNS,

  // ── HIPAA / HEALTHCARE PHI ──────────────────────────────────────────────
  ...HIPAA_PATTERNS,
];

/**
 * Obfuscation decoders.
 * Attackers may base64-encode or hex-encode sensitive data to bypass
 * pattern matching. We decode common encodings and scan the result.
 */
export function decodeObfuscation(text: string): string[] {
  const variants: string[] = [text];

  // Detect and decode base64 segments
  const base64Pattern = /[A-Za-z0-9+/]{20,}={0,2}/g;
  let match: RegExpExecArray | null;
  while ((match = base64Pattern.exec(text)) !== null) {
    try {
      const decoded = Buffer.from(match[0], "base64").toString("utf-8");
      // Only keep if it looks like readable text
      if (/^[\x20-\x7E\n\r\t]+$/.test(decoded)) {
        variants.push(decoded);
      }
    } catch {
      // Not valid base64, skip
    }
  }

  // Detect and decode hex-encoded strings
  const hexPattern = /(?:0x)?([0-9a-fA-F]{20,})/g;
  while ((match = hexPattern.exec(text)) !== null) {
    try {
      const decoded = Buffer.from(match[1], "hex").toString("utf-8");
      if (/^[\x20-\x7E\n\r\t]+$/.test(decoded)) {
        variants.push(decoded);
      }
    } catch {
      // Not valid hex, skip
    }
  }

  return variants;
}
