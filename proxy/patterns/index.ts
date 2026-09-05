/**
 * Hound Shield Proxy — standalone pattern registry.
 * No Next.js, no Supabase. Pure regex + types.
 *
 * Covers: CMMC/CUI, HIPAA/PHI, general PII/IP.
 * Sorted CRITICAL-first for early-exit scanning.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type RiskLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Action = "ALLOW" | "BLOCK" | "QUARANTINE";
export type PatternCategory = "PII" | "PHI" | "IP" | "CUI" | "CREDENTIAL";

export interface DetectionPattern {
  name: string;
  category: PatternCategory;
  regex: RegExp;
  risk_level: RiskLevel;
  action: Action;
  /** NIST 800-171 / CMMC control IDs this pattern enforces */
  nist_controls?: string[];
}

export interface DetectedEntity {
  pattern_name: string;
  category: PatternCategory;
  risk_level: RiskLevel;
  action: Action;
  nist_controls?: string[];
  /** redacted match for local log only — never transmitted */
  match_snippet?: string;
}

export interface ScanResult {
  risk_level: RiskLevel;
  action: Action;
  entities: DetectedEntity[];
  scan_ms: number;
}

// ── CMMC / CUI Patterns ────────────────────────────────────────────────────

const CMMC_PATTERNS: DetectionPattern[] = [
  {
    name: "CUI marking",
    category: "CUI",
    regex: /\bCUI(?:\/\/[\w-]+)*\b|CONTROLLED UNCLASSIFIED INFORMATION|CUI BASIC|CUI SPECIFIED/gi,
    risk_level: "CRITICAL",
    action: "BLOCK",
    nist_controls: ["AC.L2-3.1.3", "SI.L2-3.14.1"],
  },
  {
    name: "Classification markings",
    category: "CUI",
    regex: /\b(?:TOP SECRET|SECRET|CONFIDENTIAL|NOFORN|FOUO|FOR OFFICIAL USE ONLY|SENSITIVE BUT UNCLASSIFIED|SBU)\b/gi,
    risk_level: "CRITICAL",
    action: "BLOCK",
    nist_controls: ["AC.L2-3.1.3"],
  },
  {
    name: "ITAR controlled technology",
    category: "IP",
    regex: /\b(?:ITAR|EAR|USML|CCL|export controlled|export administration regulation|international traffic in arms)\b/gi,
    risk_level: "CRITICAL",
    action: "BLOCK",
    nist_controls: ["AC.L2-3.1.3", "AC.L2-3.1.22"],
  },
  {
    name: "CAGE code",
    category: "IP",
    regex: /\b(?:CAGE|cage)\s*(?:code|#|:)?\s*[0-9A-Z]{5}\b/gi,
    risk_level: "CRITICAL",
    action: "BLOCK",
    nist_controls: ["AC.L2-3.1.3"],
  },
  {
    name: "DoD contract number",
    category: "IP",
    regex: /\b[A-Z]{1,2}[0-9]{3,5}[A-Z0-9]{2}-\d{2}-[A-Z]-\d{4}\b/g,
    risk_level: "CRITICAL",
    action: "BLOCK",
    nist_controls: ["AC.L2-3.1.3", "AU.L2-3.3.1"],
  },
  {
    name: "Security clearance level",
    category: "PII",
    regex: /\b(?:security clearance|clearance level|TS\/SCI|top secret\/SCI|secret clearance|active clearance|interim clearance|clearance holder)\b/gi,
    risk_level: "CRITICAL",
    action: "BLOCK",
    nist_controls: ["AC.L2-3.1.3"],
  },
  {
    name: "SF-86 / personnel security",
    category: "PII",
    regex: /\b(?:SF-86|SF86|eQIP|DCSA|DISS|JPAS|personnel security investigation|PSI|NACLC|SSBI|Single Scope Background Investigation)\b/gi,
    risk_level: "CRITICAL",
    action: "BLOCK",
    nist_controls: ["AC.L2-3.1.3"],
  },
  {
    name: "Contract number contextual",
    category: "IP",
    regex: /\b(?:contract|award|order)\s+(?:no\.?|number|#)\s*[:\-]?\s*[A-Z0-9][A-Z0-9\-]{6,}/gi,
    risk_level: "HIGH",
    action: "BLOCK",
    nist_controls: ["AU.L2-3.3.1"],
  },
  {
    name: "Task order / delivery order",
    category: "IP",
    // Kept byte-identical to lib/classifier/cmmc-patterns.ts.
    //
    // Two bugs fixed here, both caused by the `i` flag:
    //  1. The alternation had no closing \b, so bare TO/DO matched INSIDE
    //     ordinary words — "tomorrow", "tonight", "document", "download",
    //     "together".
    //  2. [A-Z0-9]{4,} matched any word under `i`, so "to production" and
    //     "to review" were read as order numbers.
    // Measured before the fix: 10 of 10 ordinary English sentences were
    // QUARANTINEd at HIGH risk by this one rule. The closing \b plus a
    // lookahead requiring a digit removes all ten and keeps every real
    // task-order form ("TO 0001", "delivery order N0001923D0001").
    regex: /\b(?:task\s*order|delivery\s*order|TO|DO)\b\s*(?:no\.?|#)?\s*(?=[A-Z0-9]*\d)[A-Z0-9]{4,}\b/gi,
    risk_level: "HIGH",
    action: "QUARANTINE",
    nist_controls: ["AU.L2-3.3.1"],
  },
  {
    name: "DD-250 / DD form references",
    category: "IP",
    regex: /\bDD[-\s]?(?:form\s*)?(?:250|254|1155|1423|1664|2875)\b/gi,
    risk_level: "HIGH",
    action: "BLOCK",
    nist_controls: ["AU.L2-3.3.1"],
  },
  {
    name: "Military specification / standard references",
    category: "IP",
    regex: /\bMIL-(?:DTL|STD|PRF|SPEC|HDBK|S)-\d{4,6}[A-Z]?\b/gi,
    risk_level: "HIGH",
    action: "QUARANTINE",
    nist_controls: ["AC.L2-3.1.3"],
  },
  {
    name: "DUNS / UEI number",
    category: "IP",
    regex: /\b(?:DUNS|UEI)\s*(?:number|#|:)?\s*[0-9]{9}\b|\b(?:DUNS|UEI)\s*(?:number|#|:)?\s*[A-Z0-9]{12}\b/gi,
    risk_level: "HIGH",
    action: "BLOCK",
    nist_controls: ["AC.L2-3.1.3"],
  },
  {
    name: "NIPRNet / SIPRNet references",
    category: "IP",
    regex: /\b(?:NIPRNet|SIPRNet|JWICS|SIPR|NIPR|\.smil\.mil|\.sgov\.gov)\b/gi,
    risk_level: "HIGH",
    action: "BLOCK",
    nist_controls: ["AC.L2-3.1.3", "SC.L2-3.13.1"],
  },
  {
    name: "Technical data package references",
    category: "IP",
    regex: /\b(?:technical data package|TDP|engineering drawing|design specification|source code escrow|government purpose rights|GPR|SBIR data rights)\b/gi,
    risk_level: "HIGH",
    action: "QUARANTINE",
    nist_controls: ["AC.L2-3.1.3"],
  },
  {
    name: "Program office / DoD system identifier",
    category: "IP",
    // `PM` is deliberately absent — see the matching note in
    // lib/classifier/cmmc-patterns.ts. With the `i` flag a bare `PM` branch
    // fires on every clock time. The case-sensitive rule below covers it.
    regex: /\b(?:PEO|PMS|ACAT|Milestone [ABC]|SRR|PDR|CDR|TRR)\s+[A-Z0-9]+/gi,
    risk_level: "HIGH",
    action: "QUARANTINE",
    nist_controls: ["AC.L2-3.1.3"],
  },
  {
    name: "Program manager designator",
    category: "IP",
    // Case-SENSITIVE by design (no `i` flag): a designator is written
    // "PM Stryker", never "pm stryker". The negative lookbehind drops clock
    // times, the dominant false positive for a two-letter token.
    regex: /(?<!\d\s)(?<!\d)\bPM\s+[A-Z][A-Za-z0-9-]{2,}/g,
    risk_level: "HIGH",
    action: "QUARANTINE",
    nist_controls: ["AC.L2-3.1.3"],
  },
  {
    name: "CDRL reference",
    category: "IP",
    regex: /\b(?:CDRL|DI-)\s*[A-Z]{0,4}-?\d{3,5}\b/gi,
    risk_level: "MEDIUM",
    action: "QUARANTINE",
    nist_controls: ["AU.L2-3.3.1"],
  },
  {
    name: "DoD IPv4 ranges (DISA)",
    category: "IP",
    regex: /\b(?:26\.\d{1,3}\.\d{1,3}\.\d{1,3}|30\.\d{1,3}\.\d{1,3}\.\d{1,3}|214\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g,
    risk_level: "MEDIUM",
    action: "QUARANTINE",
    nist_controls: ["SC.L2-3.13.1"],
  },
];

// ── HIPAA / PHI Patterns ───────────────────────────────────────────────────

const HIPAA_PATTERNS: DetectionPattern[] = [
  {
    name: "SSN (Social Security Number)",
    category: "PII",
    regex: /\b(?!000|666|9\d{2})\d{3}[- ]?(?!00)\d{2}[- ]?(?!0{4})\d{4}\b/g,
    risk_level: "CRITICAL",
    action: "BLOCK",
    nist_controls: ["AC.L2-3.1.3"],
  },
  {
    name: "Medical record number",
    category: "PHI",
    regex: /\b(?:MRN|medical record(?:\s+number)?|patient(?:\s+id)?)\s*[:#]?\s*\d{4,10}\b/gi,
    risk_level: "CRITICAL",
    action: "BLOCK",
  },
  {
    name: "Health plan beneficiary number",
    category: "PHI",
    // Kept byte-identical to lib/classifier/hipaa-patterns.ts. This rule had
    // drifted: Mode B recognised neither `subscriber`, `policy` nor `group`
    // identifiers, so the shipped proxy let through five PHI strings the
    // hosted demo blocked. Widened to the union of both, then narrowed on
    // noise — the identifier must contain a digit, because the `i` flag makes
    // [A-Z0-9] match plain words ("Policy number pending" matched before).
    regex: /\b(?:member\s*(?:id|number|#)|beneficiary\s*(?:id|number|#)|health\s*plan\s*(?:id|number|#)|insurance\s*(?:id|number|#)|subscriber\s*(?:id|number|#)|policy\s*(?:number|#)|group\s*(?:number|#))\s*[:=#]?\s*\b(?=[A-Z0-9]*\d)[A-Z0-9]{4,20}\b/gi,
    risk_level: "CRITICAL",
    action: "BLOCK",
  },
  {
    name: "Medical diagnosis / ICD code",
    category: "PHI",
    regex: /\b(?:diagnosis|dx|icd[-\s]?(?:9|10|11)?(?:[-\s]?cm)?)\s*[:#]?\s*[A-Z]\d{2}(?:\.\d{1,4})?\b/gi,
    risk_level: "HIGH",
    action: "BLOCK",
  },
  {
    name: "Prescription / medication context",
    category: "PHI",
    regex: /\b(?:prescribed|prescription|Rx|dosage|mg|mcg|units\/day|prn|qd|bid|tid|qid|npo)\b/gi,
    risk_level: "HIGH",
    action: "QUARANTINE",
  },
  {
    name: "Lab result values",
    category: "PHI",
    regex: /\b(?:HbA1c|eGFR|creatinine|hemoglobin|hematocrit|platelets|WBC|RBC|PSA|troponin|BNP|INR|PT\/INR)\s*[:\s]+\d+(?:\.\d+)?\s*(?:mg\/dL|mmol\/L|g\/dL|%|U\/L|ng\/mL)?\b/gi,
    risk_level: "HIGH",
    action: "BLOCK",
  },
  {
    name: "PHI context indicators",
    category: "PHI",
    regex: /\b(?:date of birth|DOB|date of death|DOD|admission date|discharge date|date of service|DOS|date of procedure|date of surgery|visit date)\b/gi,
    risk_level: "MEDIUM",
    action: "QUARANTINE",
  },
  {
    name: "Provider NPI number",
    category: "PHI",
    regex: /\b(?:NPI|national provider identifier)\s*[:#]?\s*\d{10}\b/gi,
    risk_level: "HIGH",
    action: "BLOCK",
  },
];

// ── General PII / Credential Patterns ─────────────────────────────────────

const PII_PATTERNS: DetectionPattern[] = [
  {
    name: "Email address",
    category: "PII",
    regex: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g,
    risk_level: "LOW",
    action: "QUARANTINE",
  },
  {
    name: "US phone number",
    category: "PII",
    regex: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g,
    risk_level: "LOW",
    action: "QUARANTINE",
  },
  {
    name: "Credit card number",
    category: "PII",
    regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    risk_level: "CRITICAL",
    action: "BLOCK",
  },
  {
    name: "Passport number",
    category: "PII",
    regex: /\b(?:passport(?:\s+(?:no|number|#))?[:\s]*)?[A-Z]{1,2}\d{6,9}\b/gi,
    risk_level: "HIGH",
    action: "BLOCK",
  },
  {
    name: "Driver license",
    category: "PII",
    regex: /\b(?:driver(?:'?s)?\s+license|DL|dl\s*#)\s*[:#]?\s*[A-Z0-9]{6,12}\b/gi,
    risk_level: "HIGH",
    action: "BLOCK",
  },
  {
    name: "IPv4 private range — internal network exposure",
    category: "IP",
    regex: /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/g,
    risk_level: "MEDIUM",
    action: "QUARANTINE",
  },
  {
    name: "AWS secret key",
    category: "CREDENTIAL",
    regex: /\b(?:aws[_\-\s]?secret[_\-\s]?(?:access[_\-\s]?)?key|AWS_SECRET)[:\s=]+[A-Za-z0-9/+]{40}\b/gi,
    risk_level: "CRITICAL",
    action: "BLOCK",
  },
  {
    name: "Generic bearer token",
    category: "CREDENTIAL",
    regex: /\bBearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\b/g,
    risk_level: "HIGH",
    action: "BLOCK",
  },
];

// ── Merged + sorted registry ───────────────────────────────────────────────

const RISK_ORDER: Record<RiskLevel, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  NONE: 4,
};

export const ALL_PATTERNS: DetectionPattern[] = [
  ...CMMC_PATTERNS,
  ...HIPAA_PATTERNS,
  ...PII_PATTERNS,
].sort((a, b) => RISK_ORDER[a.risk_level] - RISK_ORDER[b.risk_level]);

// ── Obfuscation bypass detection ───────────────────────────────────────────

/**
 * Decodes common obfuscation attempts before scanning:
 *   - Base64 strings containing printable text
 *   - Hex-encoded strings
 * Returns original text + all decoded expansions concatenated.
 * Never throws — returns input unchanged on error.
 */
export function decodeObfuscation(text: string): string {
  const parts: string[] = [text];

  // Base64 blobs (>=16 chars, valid base64 alphabet)
  const b64re = /[A-Za-z0-9+/]{16,}={0,2}/g;
  let m: RegExpExecArray | null;
  while ((m = b64re.exec(text)) !== null) {
    try {
      const decoded = Buffer.from(m[0], "base64").toString("utf8");
      // Only keep decodings that look like printable text
      if (/[\x20-\x7E]{4,}/.test(decoded)) parts.push(decoded);
    } catch {
      // not valid base64 — skip
    }
  }

  // Hex strings (even length, >=8 hex chars)
  const hexre = /(?:0x)?[0-9a-fA-F]{8,}/g;
  while ((m = hexre.exec(text)) !== null) {
    try {
      const raw = m[0].replace(/^0x/, "");
      if (raw.length % 2 !== 0) continue;
      const decoded = Buffer.from(raw, "hex").toString("utf8");
      if (/[\x20-\x7E]{4,}/.test(decoded)) parts.push(decoded);
    } catch {
      // not valid hex — skip
    }
  }

  return parts.join(" ");
}
