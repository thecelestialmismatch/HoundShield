/**
 * CMMC-specific threat detection patterns.
 *
 * These patterns target artifacts unique to defense contracting:
 * CUI markings, CAGE codes, DoD contract numbers, DD form references,
 * security clearance language, and ITAR/EAR-controlled technology markers.
 *
 * Referenced NIST 800-171 controls:
 *  - 3.1.1  Limit system access to authorized users
 *  - 3.13.1 Monitor system communications for CUI disclosure
 *  - 3.13.16 Protect the confidentiality of CUI at rest
 */

import type { DetectionPattern } from "./patterns";

export const CMMC_PATTERNS: DetectionPattern[] = [
  // ── CUI MARKINGS ──────────────────────────────────────────────────────────

  {
    name: "CUI marking",
    category: "IP",
    // Matches: "CUI", "CUI//SP-CTI", "CUI//PRVCY", "CONTROLLED" header blocks
    regex:
      /\bCUI(?:\/\/[\w-]+)*\b|CONTROLLED UNCLASSIFIED INFORMATION|CUI BASIC|CUI SPECIFIED/gi,
    risk_level: "CRITICAL",
    action: "BLOCK",
  },
  {
    name: "Classification markings",
    category: "IP",
    // Matches legacy classification banners sometimes mixed into CUI docs
    regex:
      /\b(?:TOP SECRET|SECRET|CONFIDENTIAL|NOFORN|FOUO|FOR OFFICIAL USE ONLY|SENSITIVE BUT UNCLASSIFIED|SBU)\b/gi,
    risk_level: "CRITICAL",
    action: "BLOCK",
  },
  {
    name: "ITAR controlled technology",
    category: "IP",
    regex:
      /\b(?:ITAR|EAR|USML|CCL|export controlled|export administration regulation|international traffic in arms)\b/gi,
    risk_level: "CRITICAL",
    action: "BLOCK",
  },

  // ── CAGE CODES ────────────────────────────────────────────────────────────

  {
    name: "CAGE code",
    category: "IP",
    // CAGE codes: exactly 5 chars, alphanumeric, first char is digit or letter
    // Must appear near the word "CAGE" or preceded by typical labels
    regex: /\b(?:CAGE|cage)\s*(?:code|#|:)?\s*[0-9A-Z]{5}\b/gi,
    risk_level: "CRITICAL",
    action: "BLOCK",
  },

  // ── CONTRACT NUMBERS ──────────────────────────────────────────────────────

  {
    name: "DoD contract number",
    category: "IP",
    // Patterns: W911NF-23-C-0001, FA8650-22-D-1234, N68335-21-C-0123
    // DoD contract numbers start with a 6-char activity address code
    regex:
      /\b[A-Z]{1,2}[0-9]{3,5}[A-Z0-9]{2}-\d{2}-[A-Z]-\d{4}\b/g,
    risk_level: "CRITICAL",
    action: "BLOCK",
  },
  {
    name: "Contract number contextual",
    category: "IP",
    // "Contract No. 123-456-789" or "Contract Number: W911NF-23-C-0001"
    regex:
      /\b(?:contract|award|order)\s+(?:no\.?|number|#)\s*[:\-]?\s*[A-Z0-9][A-Z0-9\-]{6,}/gi,
    risk_level: "HIGH",
    action: "BLOCK",
  },
  {
    name: "Task order / delivery order",
    category: "IP",
    regex: /\b(?:task order|delivery order|TO|DO)\s*(?:no\.?|#)?\s*[A-Z0-9]{4,}/gi,
    risk_level: "HIGH",
    action: "QUARANTINE",
  },

  // ── DD FORMS / MILITARY DOCUMENTS ─────────────────────────────────────────

  {
    name: "DD-250 / DD form references",
    category: "IP",
    // DD-250 = Material Inspection and Receiving Report
    regex: /\bDD[-\s]?(?:form\s*)?(?:250|254|1155|1423|1664|2875)\b/gi,
    risk_level: "HIGH",
    action: "BLOCK",
  },
  {
    name: "Military specification / standard references",
    category: "IP",
    // MIL-SPEC: MIL-DTL-12345, MIL-STD-810, MIL-PRF-26514
    regex: /\bMIL-(?:DTL|STD|PRF|SPEC|HDBK|S)-\d{4,6}[A-Z]?\b/gi,
    risk_level: "HIGH",
    action: "QUARANTINE",
  },

  // ── SECURITY CLEARANCES ────────────────────────────────────────────────────

  {
    name: "Security clearance level",
    category: "PII",
    regex:
      /\b(?:security clearance|clearance level|TS\/SCI|top secret\/SCI|secret clearance|active clearance|interim clearance|clearance holder)\b/gi,
    risk_level: "CRITICAL",
    action: "BLOCK",
  },
  {
    name: "SF-86 / personnel security",
    category: "PII",
    // SF-86 is the Questionnaire for National Security Positions
    regex:
      /\b(?:SF-86|SF86|eQIP|DCSA|DISS|JPAS|personnel security investigation|PSI|NACLC|SSBI|Single Scope Background Investigation)\b/gi,
    risk_level: "CRITICAL",
    action: "BLOCK",
  },

  // ── PROGRAM / SYSTEM IDENTIFIERS ──────────────────────────────────────────

  {
    name: "Program office / DoD system identifier",
    category: "IP",
    // PEO, PM, PMS (Program Executive Office / Program Manager)
    regex: /\b(?:PEO|PM|PMS|ACAT|Milestone [ABC]|SRR|PDR|CDR|TRR)\s+[A-Z0-9]+/gi,
    risk_level: "HIGH",
    action: "QUARANTINE",
  },
  {
    name: "DUNS / UEI number",
    category: "IP",
    // Old DUNS (9 digits) or new SAM.gov UEI (12 alphanumeric)
    regex:
      /\b(?:DUNS|UEI)\s*(?:number|#|:)?\s*[0-9]{9}\b|\b(?:DUNS|UEI)\s*(?:number|#|:)?\s*[A-Z0-9]{12}\b/gi,
    risk_level: "HIGH",
    action: "BLOCK",
  },

  // ── TECHNICAL DATA / DRAWINGS ──────────────────────────────────────────────

  {
    name: "Technical data package references",
    category: "IP",
    regex:
      /\b(?:technical data package|TDP|engineering drawing|design specification|source code escrow|government purpose rights|GPR|SBIR data rights)\b/gi,
    risk_level: "HIGH",
    action: "QUARANTINE",
  },
  {
    name: "CDRL reference",
    category: "IP",
    // Contract Data Requirements List items: A001, B002, etc.
    regex: /\b(?:CDRL|DI-)\s*[A-Z]{0,4}-?\d{3,5}\b/gi,
    risk_level: "MEDIUM",
    action: "QUARANTINE",
  },

  // ── NETWORK / SYSTEM IDENTIFIERS ──────────────────────────────────────────

  {
    name: "NIPRNet / SIPRNet references",
    category: "IP",
    regex:
      /\b(?:NIPRNet|SIPRNet|JWICS|SIPR|NIPR|.smil\.mil|.sgov\.gov)\b/gi,
    risk_level: "HIGH",
    action: "BLOCK",
  },
  {
    name: "DoD IPv4 ranges (DISA)",
    category: "IP",
    // DISA-managed ranges frequently cited in network docs
    regex:
      /\b(?:26\.\d{1,3}\.\d{1,3}\.\d{1,3}|30\.\d{1,3}\.\d{1,3}\.\d{1,3}|214\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g,
    risk_level: "MEDIUM",
    action: "QUARANTINE",
  },
];
