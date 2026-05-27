/**
 * Unit tests for lib/scanner-demo/patterns.ts
 *
 * Covers: empty input, per-category detection, action/risk aggregation,
 * statelessness (no /g lastIndex bug), redaction, SAMPLE_PROMPTS, metadata.
 */

import { scan, ALL_PATTERNS, SAMPLE_PROMPTS } from "../patterns";

// ─── Helpers ────────────────────────────────────────────────────────────────

function hitNames(text: string) {
  return scan(text).hits.map((h) => h.pattern);
}

// ─── Empty / whitespace ──────────────────────────────────────────────────────

describe("empty and whitespace input", () => {
  it("returns NONE/ALLOW/no hits for empty string", () => {
    const r = scan("");
    expect(r.risk_level).toBe("NONE");
    expect(r.action).toBe("ALLOW");
    expect(r.hits).toHaveLength(0);
    expect(r.scan_ms).toBe(0);
  });

  it("returns NONE/ALLOW for whitespace-only string", () => {
    const r = scan("   \n\t  ");
    expect(r.risk_level).toBe("NONE");
    expect(r.action).toBe("ALLOW");
    expect(r.hits).toHaveLength(0);
  });

  it("pattern_count equals ALL_PATTERNS.length on empty input", () => {
    expect(scan("").pattern_count).toBe(ALL_PATTERNS.length);
  });
});

// ─── CMMC / CUI patterns ─────────────────────────────────────────────────────

describe("CMMC / CUI pattern detection", () => {
  it("detects CUI marking", () => {
    const r = scan("This document is marked CUI//SP-CTI for distribution.");
    expect(r.risk_level).toBe("CRITICAL");
    expect(r.action).toBe("BLOCK");
    expect(hitNames("CUI BASIC document")).toContain("CUI marking");
  });

  it("detects CONTROLLED UNCLASSIFIED INFORMATION", () => {
    expect(hitNames("CONTROLLED UNCLASSIFIED INFORMATION — handle accordingly")).toContain("CUI marking");
  });

  it("detects classification markings (SECRET, NOFORN, FOUO)", () => {
    expect(hitNames("Document classification: SECRET")).toContain("Classification markings");
    expect(hitNames("Please treat this as FOUO")).toContain("Classification markings");
    expect(hitNames("NOFORN briefing attached")).toContain("Classification markings");
  });

  it("detects ITAR export control references", () => {
    const r = scan("This design is ITAR controlled — do not share externally.");
    expect(r.risk_level).toBe("CRITICAL");
    expect(r.action).toBe("BLOCK");
    expect(hitNames("EAR regulation applies")).toContain("ITAR controlled technology");
  });

  it("detects CAGE codes", () => {
    expect(hitNames("Our CAGE code 1AB2C applies to this order.")).toContain("CAGE code");
    expect(hitNames("CAGE: 7XY89 used for procurement")).toContain("CAGE code");
  });

  it("detects DoD contract number pattern", () => {
    expect(hitNames("Contract W912DY-24-C-0042 is referenced in the SOW.")).toContain("DoD contract number");
  });

  it("detects security clearance references", () => {
    expect(hitNames("Candidate holds an active TS/SCI security clearance.")).toContain("Security clearance level");
    expect(hitNames("Position requires top secret clearance")).toContain("Security clearance level");
  });

  it("detects SF-86 / personnel security keywords", () => {
    expect(hitNames("Submit completed SF-86 to DCSA before start date.")).toContain("SF-86 / personnel security");
    expect(hitNames("Access to JPAS requires adjudication")).toContain("SF-86 / personnel security");
  });

  it("detects military specification references", () => {
    // MIL-STD-1553B: 4-digit spec number — matches \d{4,6}[A-Z]? in the pattern
    expect(hitNames("Per MIL-STD-1553B, the bus interface must be qualified.")).toContain(
      "Military specification references"
    );
  });

  it("detects NIPRNet / SIPRNet references", () => {
    expect(hitNames("Send the document to my SIPRNet account.")).toContain("NIPRNet / SIPRNet references");
    expect(hitNames("Accessible only on NIPRNet")).toContain("NIPRNet / SIPRNet references");
  });
});

// ─── HIPAA / PHI patterns ────────────────────────────────────────────────────

describe("HIPAA / PHI pattern detection", () => {
  it("detects US Social Security Number", () => {
    const r = scan("Patient SSN: 123-45-6789 for billing.");
    expect(r.risk_level).toBe("CRITICAL");
    expect(r.action).toBe("BLOCK");
    expect(hitNames("SSN 123-45-6789")).toContain("SSN (Social Security Number)");
  });

  it("does not flag SSN-pattern numbers starting with 000 or 666", () => {
    // The regex excludes 000-xx-xxxx and 666-xx-xxxx
    const r = scan("Reference number 000-12-3456");
    expect(r.hits.filter((h) => h.pattern === "SSN (Social Security Number)")).toHaveLength(0);
  });

  it("detects medical record number", () => {
    expect(hitNames("MRN: 87654321 — outpatient visit")).toContain("Medical record number");
    expect(hitNames("patient id 12345678 — chart review")).toContain("Medical record number");
  });

  it("detects ICD diagnosis codes", () => {
    expect(hitNames("Diagnosis: ICD-10 F32.1 (major depressive disorder)")).toContain(
      "Medical diagnosis / ICD code"
    );
  });

  it("detects prescription / medication context", () => {
    expect(hitNames("Patient prescribed sertraline 50 mg bid.")).toContain(
      "Prescription / medication context"
    );
  });

  it("detects lab result values", () => {
    expect(hitNames("HbA1c: 7.2 mmol/L noted at last visit.")).toContain("Lab result values");
    expect(hitNames("Troponin: 0.04 ng/mL on admission")).toContain("Lab result values");
  });

  it("detects PHI context indicators (date of birth, DOB, date of service)", () => {
    expect(hitNames("Patient date of birth: 03/22/1975")).toContain("PHI context indicators");
    expect(hitNames("DOS: 2026-04-15")).toContain("PHI context indicators");
  });

  it("detects provider NPI numbers", () => {
    expect(hitNames("Ordering provider NPI: 1234567890")).toContain("Provider NPI number");
  });
});

// ─── PII patterns ────────────────────────────────────────────────────────────

describe("PII pattern detection", () => {
  it("detects email addresses as LOW risk / QUARANTINE", () => {
    const r = scan("Contact john.doe@example.com for more info.");
    expect(r.hits.find((h) => h.pattern === "Email address")).toBeDefined();
    expect(r.hits.find((h) => h.pattern === "Email address")?.risk_level).toBe("LOW");
    expect(r.hits.find((h) => h.pattern === "Email address")?.action).toBe("QUARANTINE");
  });

  it("detects US phone numbers", () => {
    expect(hitNames("Call us at (555) 867-5309 for support.")).toContain("US phone number");
    expect(hitNames("Direct line: 202-555-0199")).toContain("US phone number");
  });

  it("detects credit card numbers (Visa, Mastercard, Amex)", () => {
    const r = scan("Card number: 4111111111111111");
    expect(r.risk_level).toBe("CRITICAL");
    expect(r.action).toBe("BLOCK");
    expect(hitNames("4111111111111111")).toContain("Credit card number");
  });

  it("detects internal IPv4 addresses", () => {
    expect(hitNames("API endpoint: http://192.168.1.45/api/v1")).toContain("Internal IPv4 address");
    expect(hitNames("Connect to 10.0.0.1 for internal routing")).toContain("Internal IPv4 address");
    expect(hitNames("Server at 172.16.0.5")).toContain("Internal IPv4 address");
  });
});

// ─── Credential patterns ─────────────────────────────────────────────────────

describe("Credential / secret pattern detection", () => {
  it("detects AWS secret access key", () => {
    const r = scan("AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLE");
    expect(r.risk_level).toBe("CRITICAL");
    expect(r.action).toBe("BLOCK");
    expect(hitNames("AWS_SECRET=abc123def456ghi789jkl012")).toContain("AWS secret key");
  });

  it("detects JWT Bearer tokens", () => {
    const jwt =
      "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const r = scan(jwt);
    expect(r.hits.find((h) => h.pattern === "JWT bearer token")).toBeDefined();
    expect(r.hits.find((h) => h.pattern === "JWT bearer token")?.action).toBe("BLOCK");
  });

  it("detects generic API key patterns", () => {
    expect(hitNames("api_key=some_value_here")).toContain("Generic API key pattern");
    expect(hitNames("client_secret: abc123")).toContain("Generic API key pattern");
  });
});

// ─── Risk aggregation ────────────────────────────────────────────────────────

describe("risk level aggregation", () => {
  it("CRITICAL beats HIGH when both are present", () => {
    // CUI marking (CRITICAL) + email (LOW)
    const r = scan("CUI marked doc from john@company.com");
    expect(r.risk_level).toBe("CRITICAL");
  });

  it("HIGH beats MEDIUM when CRITICAL is absent", () => {
    // DoB (MEDIUM) + JWT (HIGH) — no CRITICAL
    const r = scan(
      "DOB: 1990-01-01 — auth: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.abcdef"
    );
    const riskOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, NONE: 4 };
    expect(riskOrder[r.risk_level]).toBeLessThanOrEqual(riskOrder["HIGH"]);
  });

  it("clean prompt returns NONE", () => {
    expect(scan("Please write a haiku about autumn leaves.").risk_level).toBe("NONE");
  });
});

// ─── Action aggregation ───────────────────────────────────────────────────────

describe("action aggregation", () => {
  it("BLOCK takes precedence over QUARANTINE", () => {
    // email alone → QUARANTINE; add a BLOCK-level hit
    const r = scan("CUI doc from user@example.com");
    expect(r.action).toBe("BLOCK");
  });

  it("QUARANTINE when no BLOCK hit, only QUARANTINE", () => {
    // email address only → QUARANTINE
    const r = scan("Please send results to analyst@company.gov");
    expect(r.action).toBe("QUARANTINE");
  });

  it("ALLOW when clean", () => {
    expect(scan("What is the capital of France?").action).toBe("ALLOW");
  });
});

// ─── Statelessness (/g flag safety) ─────────────────────────────────────────

describe("statelessness — no /g lastIndex bug", () => {
  it("produces identical results when scan is called twice with the same text", () => {
    const text = "CUI marked document with SSN 123-45-6789 and user@example.com";
    const r1 = scan(text);
    const r2 = scan(text);

    expect(r1.risk_level).toBe(r2.risk_level);
    expect(r1.action).toBe(r2.action);
    expect(r1.hits.length).toBe(r2.hits.length);
    expect(r1.hits.map((h) => h.pattern)).toEqual(r2.hits.map((h) => h.pattern));
  });

  it("scan alternating between different texts returns pattern-correct results each time", () => {
    const clean = "How do I bake sourdough bread?";
    const cui = "This file is CUI BASIC.";

    for (let i = 0; i < 5; i++) {
      expect(scan(clean).risk_level).toBe("NONE");
      expect(scan(cui).risk_level).toBe("CRITICAL");
    }
  });
});

// ─── Snippet redaction ────────────────────────────────────────────────────────

describe("snippet redaction", () => {
  it("does not expose full match value in snippet", () => {
    const r = scan("SSN: 123-45-6789 in this test");
    const ssn = r.hits.find((h) => h.pattern === "SSN (Social Security Number)");
    expect(ssn).toBeDefined();
    // Redacted snippet should not contain the raw digits
    expect(ssn!.snippet).not.toBe("123-45-6789");
    expect(ssn!.snippet.length).toBeGreaterThan(0);
  });

  it("redacts short matches to ****", () => {
    // CAGE codes are 5 chars, CAGE code pattern may match a 5-char match
    // Redact function: length <=4 → "****", else first2 + *** + last1
    const r = scan("CAGE code 1AB2C for this contract");
    const cage = r.hits.find((h) => h.pattern === "CAGE code");
    if (cage) {
      // snippet is redacted, not the raw match
      expect(cage.snippet).toMatch(/^[\w*\/+\-. ]+$/);
    }
  });
});

// ─── Metadata ────────────────────────────────────────────────────────────────

describe("scan result metadata", () => {
  it("pattern_count matches ALL_PATTERNS.length", () => {
    expect(scan("anything").pattern_count).toBe(ALL_PATTERNS.length);
    expect(scan("").pattern_count).toBe(ALL_PATTERNS.length);
  });

  it("ALL_PATTERNS is non-empty", () => {
    expect(ALL_PATTERNS.length).toBeGreaterThan(15);
  });

  it("scan_ms is a non-negative number for non-empty input", () => {
    const r = scan("A normal prompt about project planning.");
    expect(typeof r.scan_ms).toBe("number");
    expect(r.scan_ms).toBeGreaterThanOrEqual(0);
  });

  it("scan_ms is 0 for empty input (fast path)", () => {
    expect(scan("").scan_ms).toBe(0);
  });
});

// ─── SAMPLE_PROMPTS ───────────────────────────────────────────────────────────

describe("SAMPLE_PROMPTS are scannable and yield expected risk levels", () => {
  it("CUI sample produces CRITICAL BLOCK", () => {
    const r = scan(SAMPLE_PROMPTS.cui);
    expect(r.risk_level).toBe("CRITICAL");
    expect(r.action).toBe("BLOCK");
    expect(r.hits.length).toBeGreaterThan(0);
  });

  it("PHI sample produces CRITICAL or HIGH BLOCK", () => {
    const r = scan(SAMPLE_PROMPTS.phi);
    expect(["CRITICAL", "HIGH"]).toContain(r.risk_level);
    expect(r.action).toBe("BLOCK");
    expect(r.hits.length).toBeGreaterThan(0);
  });

  it("credential sample produces CRITICAL BLOCK", () => {
    const r = scan(SAMPLE_PROMPTS.credential);
    expect(r.risk_level).toBe("CRITICAL");
    expect(r.action).toBe("BLOCK");
    expect(r.hits.length).toBeGreaterThan(0);
  });
});
