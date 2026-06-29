/**
 * HIPAA PHI detection patterns.
 *
 * The 18 HIPAA Safe Harbor identifiers (45 CFR §164.514(b)(2)).
 * These patterns detect Protected Health Information (PHI) that
 * could violate HIPAA when sent to AI tools like ChatGPT, Copilot, or Claude.
 *
 * Penalty range: $100–$50,000 per violation, up to $1.9M per category/year.
 *
 * Design: Conservative detection — false positives are caught by quarantine review.
 * Medical context keywords boost confidence but are not required for high-risk identifiers.
 */

import type { DetectionPattern } from "./patterns";
import type { RiskLevel } from "@/lib/supabase/types";

// Medical context keywords used to boost detection confidence
const MEDICAL_CONTEXT =
  /\b(?:patient|diagnosis|treatment|medication|prescription|clinical|hospital|physician|doctor|nurse|medical|healthcare|health\s*care|EHR|EMR|chart|admit|discharge|lab\s*result|radiology|pathology|procedure|ICD[-\s]?\d{1,2}|CPT|HCPCS|NPI|DEA\s*number|pharmacy|HIPAA|PHI|protected\s*health)/i;

export const HIPAA_PATTERNS: DetectionPattern[] = [
  // ── 1. Patient Names (with medical context) ─────────────────────────
  {
    name: "Patient name in medical context",
    category: "HIPAA_PHI",
    regex:
      /\b(?:patient|pt|client|resident|member)\s*(?:name|:)\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/gi,
    risk_level: "CRITICAL",
    action: "BLOCK",
  },

  // ── 2. Geographic data smaller than state ───────────────────────────
  {
    name: "Street address",
    category: "HIPAA_PHI",
    regex:
      /\b\d{1,5}\s+(?:[A-Z][a-z]+\s+){1,3}(?:St(?:reet)?|Ave(?:nue)?|Blvd|Dr(?:ive)?|Ln|Lane|Ct|Court|Rd|Road|Way|Pl(?:ace)?|Cir(?:cle)?)\b/gi,
    risk_level: "HIGH",
    action: "BLOCK",
  },
  {
    name: "ZIP code (5-digit or ZIP+4)",
    category: "HIPAA_PHI",
    regex: /\b(?:zip|postal)\s*(?:code)?\s*[:=]?\s*\d{5}(?:-\d{4})?\b/gi,
    risk_level: "HIGH",
    action: "QUARANTINE",
  },

  // ── 3. Dates (except year) — DOB, admission, discharge, death ──────
  {
    name: "Medical dates (DOB, admission, discharge, death)",
    category: "HIPAA_PHI",
    regex:
      /\b(?:DOB|date\s*of\s*birth|admission\s*date|discharge\s*date|date\s*of\s*death|death\s*date|born|admitted|discharged)\s*[:=]?\s*\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/gi,
    risk_level: "CRITICAL",
    action: "BLOCK",
  },

  // ── 4. Phone numbers ───────────────────────────────────────────────
  {
    name: "Phone number (HIPAA context)",
    category: "HIPAA_PHI",
    regex:
      /\b(?:phone|tel|cell|mobile|fax|contact)\s*(?:#|number|no\.?)?\s*[:=]?\s*(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/gi,
    risk_level: "HIGH",
    action: "BLOCK",
  },

  // ── 5. Fax numbers ────────────────────────────────────────────────
  {
    name: "Fax number",
    category: "HIPAA_PHI",
    regex:
      /\b(?:fax)\s*(?:#|number|no\.?)?\s*[:=]?\s*(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/gi,
    risk_level: "HIGH",
    action: "BLOCK",
  },

  // ── 6. Email addresses (medical context) ──────────────────────────
  {
    name: "Email in medical context",
    category: "HIPAA_PHI",
    regex:
      /\b(?:patient|doctor|physician|nurse|provider)\s*(?:email|e-mail)\s*[:=]?\s*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/gi,
    risk_level: "HIGH",
    action: "BLOCK",
  },

  // ── 7. Social Security Numbers ─────────────────────────────────────
  {
    name: "SSN (HIPAA)",
    category: "HIPAA_PHI",
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    risk_level: "CRITICAL",
    action: "BLOCK",
  },

  // ── 8. Medical Record Numbers ──────────────────────────────────────
  {
    name: "Medical record number (MRN)",
    category: "HIPAA_PHI",
    regex:
      /\b(?:MRN|medical\s*record\s*(?:number|#|no\.?)|chart\s*(?:number|#|no\.?)|patient\s*(?:ID|id|number|#))\s*[:=]?\s*[A-Z0-9]{4,15}\b/gi,
    risk_level: "CRITICAL",
    action: "BLOCK",
  },

  // ── 9. Health plan beneficiary numbers ─────────────────────────────
  {
    name: "Health plan beneficiary number",
    category: "HIPAA_PHI",
    regex:
      /\b(?:member\s*ID|beneficiary\s*(?:number|#|ID)|subscriber\s*(?:number|#|ID)|insurance\s*(?:ID|number|#)|policy\s*(?:number|#)|group\s*(?:number|#))\s*[:=]?\s*[A-Z0-9]{4,20}\b/gi,
    risk_level: "HIGH",
    action: "BLOCK",
  },

  // ── 10. Account numbers (medical context) ──────────────────────────
  {
    name: "Medical account number",
    category: "HIPAA_PHI",
    regex:
      /\b(?:patient\s*account|billing\s*account|hospital\s*account)\s*(?:#|number|no\.?)?\s*[:=]?\s*[A-Z0-9]{6,17}\b/gi,
    risk_level: "HIGH",
    action: "QUARANTINE",
  },

  // ── 11. Certificate/license numbers ────────────────────────────────
  {
    name: "Medical license number",
    category: "HIPAA_PHI",
    regex:
      /\b(?:medical\s*license|license\s*(?:number|#|no\.?)|DEA\s*(?:number|#)|NPI\s*(?:number|#)?)\s*[:=]?\s*[A-Z0-9]{5,15}\b/gi,
    risk_level: "HIGH",
    action: "QUARANTINE",
  },

  // ── 12. Vehicle identification numbers ─────────────────────────────
  {
    name: "VIN",
    category: "HIPAA_PHI",
    regex:
      /\b(?:VIN|vehicle\s*identification)\s*(?:#|number|no\.?)?\s*[:=]?\s*[A-HJ-NPR-Z0-9]{17}\b/gi,
    risk_level: "MEDIUM",
    action: "QUARANTINE",
  },

  // ── 13. Device identifiers and serial numbers ──────────────────────
  {
    name: "Medical device identifier",
    category: "HIPAA_PHI",
    regex:
      /\b(?:UDI|device\s*(?:ID|identifier|serial)|serial\s*(?:number|#|no\.?)|implant\s*(?:ID|serial))\s*[:=]?\s*[A-Z0-9\-]{6,30}\b/gi,
    risk_level: "HIGH",
    action: "QUARANTINE",
  },

  // ── 14. URLs (medical context) ─────────────────────────────────────
  {
    name: "URL in medical context",
    category: "HIPAA_PHI",
    regex:
      /\b(?:patient\s*portal|EHR|EMR|health\s*record)\s*(?:URL|link|address)\s*[:=]?\s*https?:\/\/[^\s]+/gi,
    risk_level: "MEDIUM",
    action: "QUARANTINE",
  },

  // ── 15. IP addresses (medical context) ─────────────────────────────
  {
    name: "IP address in medical system",
    category: "HIPAA_PHI",
    regex:
      /\b(?:EHR|EMR|PACS|HL7|FHIR|medical\s*device|workstation)\s*(?:IP|address)\s*[:=]?\s*\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/gi,
    risk_level: "MEDIUM",
    action: "QUARANTINE",
  },

  // ── 16. Biometric identifiers ──────────────────────────────────────
  {
    name: "Biometric identifier",
    category: "HIPAA_PHI",
    regex:
      /\b(?:fingerprint|retina|iris|voice\s*print|palm\s*print|facial\s*recognition|biometric)\s*(?:data|scan|ID|identifier|template)\b/gi,
    risk_level: "HIGH",
    action: "BLOCK",
  },

  // ── 17. Full-face photos and comparable images ─────────────────────
  {
    name: "Patient photo reference",
    category: "HIPAA_PHI",
    regex:
      /\b(?:patient\s*photo|clinical\s*image|wound\s*photo|medical\s*image|face\s*photo|diagnostic\s*image)\b/gi,
    risk_level: "HIGH",
    action: "QUARANTINE",
  },

  // ── 18. Any unique identifying number ──────────────────────────────
  {
    name: "Medicare/Medicaid beneficiary ID",
    category: "HIPAA_PHI",
    regex:
      /\b(?:Medicare|Medicaid)\s*(?:beneficiary|ID|number|#)\s*[:=]?\s*[A-Z0-9]{8,12}\b/gi,
    risk_level: "CRITICAL",
    action: "BLOCK",
  },
  {
    name: "Health record identifier",
    category: "HIPAA_PHI",
    regex:
      /\b(?:encounter\s*(?:ID|number|#)|visit\s*(?:ID|number|#)|case\s*(?:ID|number|#))\s*[:=]?\s*[A-Z0-9]{4,15}\b/gi,
    risk_level: "HIGH",
    action: "QUARANTINE",
  },
];

/**
 * Detect HIPAA PHI in text.
 * Returns found patterns and severity based on the worst match.
 */
export function detectHIPAA(text: string): {
  found: boolean;
  patterns: string[];
  severity: "HIGH" | "CRITICAL";
  matchCount: number;
} {
  const foundPatterns: string[] = [];
  let worstSeverity: RiskLevel = "HIGH";
  let totalMatches = 0;

  for (const pattern of HIPAA_PATTERNS) {
    pattern.regex.lastIndex = 0;
    const matches = text.match(pattern.regex);
    if (matches && matches.length > 0) {
      foundPatterns.push(pattern.name);
      totalMatches += matches.length;
      if (
        pattern.risk_level === "CRITICAL" &&
        worstSeverity !== "CRITICAL"
      ) {
        worstSeverity = "CRITICAL";
      }
    }
  }

  return {
    found: foundPatterns.length > 0,
    patterns: foundPatterns,
    severity: worstSeverity === "CRITICAL" ? "CRITICAL" : "HIGH",
    matchCount: totalMatches,
  };
}

/**
 * Check if text contains medical context keywords.
 * Used to boost detection confidence when PHI appears near medical terms.
 */
export function hasMedicalContext(text: string): boolean {
  return MEDICAL_CONTEXT.test(text);
}
