/**
 * Browser-safe CUI/PHI/PII scanner for the homepage live demo.
 * Mirrors proxy/patterns/index.ts regex logic — no Node.js dependencies.
 * Runs entirely in the browser; zero data transmitted anywhere.
 */

export type RiskLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Action = "ALLOW" | "BLOCK" | "QUARANTINE";
export type PatternCategory = "PII" | "PHI" | "IP" | "CUI" | "CREDENTIAL";

export interface ScanPattern {
  name: string;
  category: PatternCategory;
  regex: RegExp;
  risk_level: RiskLevel;
  action: Action;
  nist_controls: string[];
}

export interface ScanHit {
  pattern: string;
  category: PatternCategory;
  risk_level: RiskLevel;
  action: Action;
  nist_controls: string[];
  snippet: string;
}

export interface ScanResult {
  risk_level: RiskLevel;
  action: Action;
  hits: ScanHit[];
  pattern_count: number;
  scan_ms: number;
}

const CMMC_PATTERNS: ScanPattern[] = [
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
    regex: /\b(?:SF-86|SF86|eQIP|DCSA|DISS|JPAS|personnel security investigation|PSI|NACLC|SSBI)\b/gi,
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
    name: "Military specification references",
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
    regex: /\b(?:technical data package|TDP|engineering drawing|design specification|government purpose rights|GPR|SBIR data rights)\b/gi,
    risk_level: "HIGH",
    action: "QUARANTINE",
    nist_controls: ["AC.L2-3.1.3"],
  },
];

const HIPAA_PATTERNS: ScanPattern[] = [
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
    nist_controls: [],
  },
  {
    name: "Medical diagnosis / ICD code",
    category: "PHI",
    regex: /\b(?:diagnosis|dx|icd[-\s]?(?:9|10|11)?(?:[-\s]?cm)?)\s*[:#]?\s*[A-Z]\d{2}(?:\.\d{1,4})?\b/gi,
    risk_level: "HIGH",
    action: "BLOCK",
    nist_controls: [],
  },
  {
    name: "Prescription / medication context",
    category: "PHI",
    regex: /\b(?:prescribed|prescription|dosage|mg\b|mcg\b|units\/day|prn\b|qd\b|bid\b|tid\b|qid\b|npo\b)\b/gi,
    risk_level: "HIGH",
    action: "QUARANTINE",
    nist_controls: [],
  },
  {
    name: "Lab result values",
    category: "PHI",
    regex: /\b(?:HbA1c|eGFR|creatinine|hemoglobin|hematocrit|platelets|WBC|RBC|PSA|troponin|BNP|INR)\s*[:\s]+\d+(?:\.\d+)?\s*(?:mg\/dL|mmol\/L|g\/dL|%|U\/L|ng\/mL)?\b/gi,
    risk_level: "HIGH",
    action: "BLOCK",
    nist_controls: [],
  },
  {
    name: "PHI context indicators",
    category: "PHI",
    regex: /\b(?:date of birth|DOB\b|date of death|admission date|discharge date|date of service|DOS\b|date of procedure|visit date)\b/gi,
    risk_level: "MEDIUM",
    action: "QUARANTINE",
    nist_controls: [],
  },
  {
    name: "Provider NPI number",
    category: "PHI",
    regex: /\b(?:NPI|national provider identifier)\s*[:#]?\s*\d{10}\b/gi,
    risk_level: "HIGH",
    action: "BLOCK",
    nist_controls: [],
  },
];

const PII_PATTERNS: ScanPattern[] = [
  {
    name: "Email address",
    category: "PII",
    regex: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g,
    risk_level: "LOW",
    action: "QUARANTINE",
    nist_controls: [],
  },
  {
    name: "US phone number",
    category: "PII",
    regex: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g,
    risk_level: "LOW",
    action: "QUARANTINE",
    nist_controls: [],
  },
  {
    name: "Credit card number",
    category: "PII",
    regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    risk_level: "CRITICAL",
    action: "BLOCK",
    nist_controls: [],
  },
  {
    name: "Driver license",
    category: "PII",
    regex: /\b(?:driver(?:'?s)?\s+license|DL\s*#)\s*[:#]?\s*[A-Z0-9]{6,12}\b/gi,
    risk_level: "HIGH",
    action: "BLOCK",
    nist_controls: [],
  },
  {
    name: "Internal IPv4 address",
    category: "IP",
    regex: /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/g,
    risk_level: "MEDIUM",
    action: "QUARANTINE",
    nist_controls: [],
  },
  {
    name: "AWS secret key",
    category: "CREDENTIAL",
    regex: /\b(?:aws[_\-\s]?secret[_\-\s]?(?:access[_\-\s]?)?key|AWS_SECRET)[:\s=]+[A-Za-z0-9\/+]{24,}\b/gi,
    risk_level: "CRITICAL",
    action: "BLOCK",
    nist_controls: [],
  },
  {
    name: "JWT bearer token",
    category: "CREDENTIAL",
    regex: /\bBearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\b/g,
    risk_level: "HIGH",
    action: "BLOCK",
    nist_controls: [],
  },
  {
    name: "Generic API key pattern",
    category: "CREDENTIAL",
    regex: /\b(?:api[_\-]?key|apikey|api_secret|client[_\-]?secret|sk[_\-](?:live|test)[_\-][A-Za-z0-9]{16,})\b/gi,
    risk_level: "HIGH",
    action: "BLOCK",
    nist_controls: [],
  },
];

const RISK_ORDER: Record<RiskLevel, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  NONE: 4,
};

export const ALL_PATTERNS: ScanPattern[] = [
  ...CMMC_PATTERNS,
  ...HIPAA_PATTERNS,
  ...PII_PATTERNS,
].sort((a, b) => RISK_ORDER[a.risk_level] - RISK_ORDER[b.risk_level]);

function redact(match: string): string {
  if (match.length <= 4) return "****";
  return match.slice(0, 2) + "***" + match.slice(-1);
}

export function scan(text: string): ScanResult {
  const t0 = performance.now();

  if (!text || text.trim().length === 0) {
    return {
      risk_level: "NONE",
      action: "ALLOW",
      hits: [],
      pattern_count: ALL_PATTERNS.length,
      scan_ms: 0,
    };
  }

  const hits: ScanHit[] = [];
  const seen = new Set<string>();

  for (const pattern of ALL_PATTERNS) {
    if (seen.has(pattern.name)) continue;
    const re = new RegExp(pattern.regex.source, pattern.regex.flags);
    const match = re.exec(text);
    if (match) {
      seen.add(pattern.name);
      hits.push({
        pattern: pattern.name,
        category: pattern.category,
        risk_level: pattern.risk_level,
        action: pattern.action,
        nist_controls: pattern.nist_controls,
        snippet: redact(match[0]),
      });
    }
  }

  const risk_level: RiskLevel =
    hits.length === 0
      ? "NONE"
      : hits.reduce(
          (max, h) =>
            RISK_ORDER[h.risk_level] < RISK_ORDER[max] ? h.risk_level : max,
          "NONE" as RiskLevel
        );

  const action: Action = hits.some((h) => h.action === "BLOCK")
    ? "BLOCK"
    : hits.some((h) => h.action === "QUARANTINE")
    ? "QUARANTINE"
    : "ALLOW";

  return {
    risk_level,
    action,
    hits,
    pattern_count: ALL_PATTERNS.length,
    scan_ms: Math.round((performance.now() - t0) * 100) / 100,
  };
}

export const SAMPLE_PROMPTS = {
  cui: `Help me draft a summary for contract W912DY-24-C-0042. The SOW references our CAGE code 1AB2C and the technical data package contains CUI//SP-CTI information. This is ITAR controlled. Please summarize for the program manager.`,
  phi: `Patient Jane Smith, DOB: 03/22/1975, MRN: 87654321. Diagnosis: ICD-10 F32.1 (major depressive disorder). Prescribed sertraline 50mg bid. Lab: HbA1c: 7.2 mmol/L at date of service 2026-04-15.`,
  credential: `Connect to staging using AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLE and auth with Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c to call the internal API at 192.168.1.45.`,
} as const;
