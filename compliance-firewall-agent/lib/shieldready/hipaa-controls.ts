/**
 * HIPAA Security Rule Control Mapping — Kaelus.Online
 *
 * Maps the HIPAA Security Rule controls (45 CFR Part 164) with
 * AI risk relevance annotations. Follows the same architectural
 * pattern as the SPRS scoring engine (scoring.ts).
 *
 * Authoritative references:
 *   - 45 CFR §164.308 — Administrative Safeguards
 *   - 45 CFR §164.310 — Physical Safeguards
 *   - 45 CFR §164.312 — Technical Safeguards
 *   - HHS Breach Notification Rule (§164.400–414)
 *
 * Penalty tiers (per HITECH Act):
 *   - Tier 1: $100–$50,000 per violation (did not know)
 *   - Tier 2: $1,000–$50,000 per violation (reasonable cause)
 *   - Tier 3: $10,000–$50,000 per violation (willful neglect, corrected)
 *   - Tier 4: $50,000 per violation (willful neglect, not corrected)
 *   - Annual cap: $1.9M per violation category
 */

// ── Types ────────────────────────────────────────────────────────────

export type HIPAAControlCategory = "Administrative" | "Physical" | "Technical";

export interface HIPAAControl {
  id: string;
  title: string;
  category: HIPAAControlCategory;
  required: boolean; // Required vs Addressable
  description: string;
  aiRiskRelevance: string;
  cfr: string; // CFR citation
}

export interface HIPAAAssessmentAnswer {
  controlId: string;
  status: "MET" | "PARTIALLY_MET" | "NOT_MET" | "NOT_APPLICABLE";
  notes?: string;
}

export type HIPAAAssessmentAnswers = HIPAAAssessmentAnswer[];

export interface HIPAAScoreResult {
  score: number; // 0-100
  totalControls: number;
  metCount: number;
  partialCount: number;
  unmetCount: number;
  naCount: number;
  gaps: HIPAAGap[];
  recommendations: string[];
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  categoryScores: Record<HIPAAControlCategory, number>;
}

export interface HIPAAGap {
  controlId: string;
  title: string;
  category: HIPAAControlCategory;
  status: "PARTIALLY_MET" | "NOT_MET";
  aiRiskRelevance: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM";
}

// ── Controls ─────────────────────────────────────────────────────────

export const HIPAA_CONTROLS: HIPAAControl[] = [
  // ── Administrative Safeguards (§164.308) ───────────────────────────

  {
    id: "HIPAA-164.308-a1",
    title: "Security Management Process",
    category: "Administrative",
    required: true,
    cfr: "§164.308(a)(1)",
    description:
      "Implement policies and procedures to prevent, detect, contain, and correct security violations. Includes risk analysis, risk management, sanction policy, and information system activity review.",
    aiRiskRelevance:
      "AI tools process PHI in prompts — risk analysis must cover LLM data flows. Sanction policies must address unauthorized AI tool usage with patient data.",
  },
  {
    id: "HIPAA-164.308-a2",
    title: "Assigned Security Responsibility",
    category: "Administrative",
    required: true,
    cfr: "§164.308(a)(2)",
    description:
      "Identify the security official responsible for developing and implementing security policies.",
    aiRiskRelevance:
      "Security official must oversee AI tool policies and approve which AI services may process PHI.",
  },
  {
    id: "HIPAA-164.308-a3",
    title: "Workforce Security",
    category: "Administrative",
    required: true,
    cfr: "§164.308(a)(3)",
    description:
      "Implement policies ensuring workforce members have appropriate access to ePHI and prevent unauthorized access. Includes authorization, workforce clearance, and termination procedures.",
    aiRiskRelevance:
      "Must control which workforce members can use AI tools with PHI. Termination procedures must revoke AI tool access.",
  },
  {
    id: "HIPAA-164.308-a4",
    title: "Information Access Management",
    category: "Administrative",
    required: true,
    cfr: "§164.308(a)(4)",
    description:
      "Implement policies authorizing access to ePHI consistent with the minimum necessary standard.",
    aiRiskRelevance:
      "AI tool access must follow minimum necessary — users should not paste full patient records into ChatGPT when only a specific data point is needed.",
  },
  {
    id: "HIPAA-164.308-a5",
    title: "Security Awareness and Training",
    category: "Administrative",
    required: true,
    cfr: "§164.308(a)(5)",
    description:
      "Implement a security awareness and training program for all workforce members. Includes security reminders, malicious software protection, log-in monitoring, and password management.",
    aiRiskRelevance:
      "Training must cover AI-specific risks: never paste PHI into public AI tools, recognize AI-generated hallucinations in clinical contexts, understand data retention policies of AI services.",
  },
  {
    id: "HIPAA-164.308-a6",
    title: "Security Incident Procedures",
    category: "Administrative",
    required: true,
    cfr: "§164.308(a)(6)",
    description:
      "Implement policies to address security incidents. Includes response and reporting procedures.",
    aiRiskRelevance:
      "PHI leaked to an AI service is a security incident requiring breach notification within 60 days if it affects 500+ individuals.",
  },
  {
    id: "HIPAA-164.308-a7",
    title: "Contingency Plan",
    category: "Administrative",
    required: true,
    cfr: "§164.308(a)(7)",
    description:
      "Establish policies for responding to emergencies or other occurrences that damage systems containing ePHI. Includes data backup, disaster recovery, and emergency mode operation.",
    aiRiskRelevance:
      "If AI tools are used in clinical workflows, contingency plans must address AI service outages and ensure clinical operations continue without AI assistance.",
  },
  {
    id: "HIPAA-164.308-a8",
    title: "Evaluation",
    category: "Administrative",
    required: true,
    cfr: "§164.308(a)(8)",
    description:
      "Perform periodic technical and non-technical evaluations to establish the extent to which security policies meet the Security Rule requirements.",
    aiRiskRelevance:
      "Evaluations must include AI tool usage patterns, PHI exposure incidents via AI, and effectiveness of AI security controls like Kaelus.",
  },

  // ── Physical Safeguards (§164.310) ─────────────────────────────────

  {
    id: "HIPAA-164.310-a1",
    title: "Facility Access Controls",
    category: "Physical",
    required: true,
    cfr: "§164.310(a)(1)",
    description:
      "Implement policies to limit physical access to electronic information systems and the facility in which they are housed.",
    aiRiskRelevance:
      "Workstations with AI tool access containing PHI must be in controlled areas. Remote workers using AI tools need equivalent physical security.",
  },
  {
    id: "HIPAA-164.310-b",
    title: "Workstation Use",
    category: "Physical",
    required: true,
    cfr: "§164.310(b)",
    description:
      "Implement policies specifying the proper functions to be performed and the manner in which they are performed at workstations accessing ePHI.",
    aiRiskRelevance:
      "Workstation policies must specify approved AI tools and prohibit use of unapproved AI services for PHI-related tasks.",
  },
  {
    id: "HIPAA-164.310-c",
    title: "Workstation Security",
    category: "Physical",
    required: true,
    cfr: "§164.310(c)",
    description:
      "Implement physical safeguards for workstations that access ePHI to restrict access to authorized users.",
    aiRiskRelevance:
      "AI tool sessions may cache PHI — workstations must auto-lock and clear browser history/AI chat sessions.",
  },
  {
    id: "HIPAA-164.310-d1",
    title: "Device and Media Controls",
    category: "Physical",
    required: true,
    cfr: "§164.310(d)(1)",
    description:
      "Implement policies governing the receipt and removal of hardware and electronic media that contain ePHI.",
    aiRiskRelevance:
      "AI tools may cache PHI locally — device disposal must account for AI application data, browser cache, and local model data.",
  },

  // ── Technical Safeguards (§164.312) ────────────────────────────────

  {
    id: "HIPAA-164.312-a1",
    title: "Access Control",
    category: "Technical",
    required: true,
    cfr: "§164.312(a)(1)",
    description:
      "Implement technical policies to allow only authorized persons to access ePHI. Includes unique user IDs, emergency access procedure, automatic logoff, and encryption.",
    aiRiskRelevance:
      "AI tools must require authentication. PHI in AI prompts must be encrypted in transit. Auto-logoff must apply to AI tool sessions.",
  },
  {
    id: "HIPAA-164.312-b",
    title: "Audit Controls",
    category: "Technical",
    required: true,
    cfr: "§164.312(b)",
    description:
      "Implement hardware, software, and/or procedural mechanisms to record and examine activity in systems containing ePHI.",
    aiRiskRelevance:
      "Every AI interaction involving PHI must be logged. Kaelus provides this via its compliance event audit trail with SHA-256 hash chain integrity.",
  },
  {
    id: "HIPAA-164.312-c1",
    title: "Integrity",
    category: "Technical",
    required: true,
    cfr: "§164.312(c)(1)",
    description:
      "Implement policies to protect ePHI from improper alteration or destruction. Includes mechanism to authenticate ePHI.",
    aiRiskRelevance:
      "AI-generated clinical content must be validated before use. AI tools must not modify source PHI. Kaelus blockchain anchoring provides tamper-proof evidence.",
  },
  {
    id: "HIPAA-164.312-d",
    title: "Person or Entity Authentication",
    category: "Technical",
    required: true,
    cfr: "§164.312(d)",
    description:
      "Implement procedures to verify that a person or entity seeking access to ePHI is who they claim to be.",
    aiRiskRelevance:
      "AI tool access must be tied to authenticated user identities. Shared AI accounts violate this control.",
  },
  {
    id: "HIPAA-164.312-e1",
    title: "Transmission Security",
    category: "Technical",
    required: true,
    cfr: "§164.312(e)(1)",
    description:
      "Implement technical security measures to guard against unauthorized access to ePHI being transmitted over an electronic communications network.",
    aiRiskRelevance:
      "PHI sent to AI APIs must use TLS 1.2+. Kaelus intercepts AI traffic before it leaves the network, blocking PHI before it reaches external AI services.",
  },
];

// ── Scoring ──────────────────────────────────────────────────────────

/**
 * Calculate HIPAA compliance score from assessment answers.
 *
 * Scoring methodology:
 *   - MET = full points for that control
 *   - PARTIALLY_MET = 50% points
 *   - NOT_MET = 0 points
 *   - NOT_APPLICABLE = excluded from total
 *
 * Returns a score from 0-100 representing compliance percentage.
 */
export function calculateHIPAAScore(
  answers: HIPAAAssessmentAnswers
): HIPAAScoreResult {
  const answerMap = new Map(answers.map((a) => [a.controlId, a]));

  let totalApplicable = 0;
  let metPoints = 0;
  let metCount = 0;
  let partialCount = 0;
  let unmetCount = 0;
  let naCount = 0;
  const gaps: HIPAAGap[] = [];

  const categoryTotals: Record<HIPAAControlCategory, number> = {
    Administrative: 0,
    Physical: 0,
    Technical: 0,
  };
  const categoryMet: Record<HIPAAControlCategory, number> = {
    Administrative: 0,
    Physical: 0,
    Technical: 0,
  };

  for (const control of HIPAA_CONTROLS) {
    const answer = answerMap.get(control.id);
    const status = answer?.status ?? "NOT_MET";

    if (status === "NOT_APPLICABLE") {
      naCount++;
      continue;
    }

    totalApplicable++;
    categoryTotals[control.category]++;

    switch (status) {
      case "MET":
        metPoints += 1;
        metCount++;
        categoryMet[control.category] += 1;
        break;
      case "PARTIALLY_MET":
        metPoints += 0.5;
        partialCount++;
        categoryMet[control.category] += 0.5;
        gaps.push({
          controlId: control.id,
          title: control.title,
          category: control.category,
          status: "PARTIALLY_MET",
          aiRiskRelevance: control.aiRiskRelevance,
          priority: control.required ? "HIGH" : "MEDIUM",
        });
        break;
      case "NOT_MET":
        unmetCount++;
        gaps.push({
          controlId: control.id,
          title: control.title,
          category: control.category,
          status: "NOT_MET",
          aiRiskRelevance: control.aiRiskRelevance,
          priority: control.required ? "CRITICAL" : "HIGH",
        });
        break;
    }
  }

  const score =
    totalApplicable > 0
      ? Math.round((metPoints / totalApplicable) * 100)
      : 0;

  const categoryScores: Record<HIPAAControlCategory, number> = {
    Administrative:
      categoryTotals.Administrative > 0
        ? Math.round(
            (categoryMet.Administrative / categoryTotals.Administrative) * 100
          )
        : 100,
    Physical:
      categoryTotals.Physical > 0
        ? Math.round(
            (categoryMet.Physical / categoryTotals.Physical) * 100
          )
        : 100,
    Technical:
      categoryTotals.Technical > 0
        ? Math.round(
            (categoryMet.Technical / categoryTotals.Technical) * 100
          )
        : 100,
  };

  // Generate recommendations based on gaps
  const recommendations = generateRecommendations(gaps, score);

  return {
    score,
    totalControls: HIPAA_CONTROLS.length,
    metCount,
    partialCount,
    unmetCount,
    naCount,
    gaps: gaps.sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }),
    recommendations,
    riskLevel: hipaaRiskLevel(score),
    categoryScores,
  };
}

/**
 * Map a HIPAA compliance score to a risk level.
 */
export function hipaaRiskLevel(
  score: number
): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" {
  if (score < 40) return "CRITICAL";
  if (score < 60) return "HIGH";
  if (score < 80) return "MEDIUM";
  return "LOW";
}

/**
 * Generate actionable recommendations based on gaps.
 */
function generateRecommendations(
  gaps: HIPAAGap[],
  score: number
): string[] {
  const recs: string[] = [];

  const criticalGaps = gaps.filter((g) => g.priority === "CRITICAL");
  const highGaps = gaps.filter((g) => g.priority === "HIGH");

  if (criticalGaps.length > 0) {
    recs.push(
      `Address ${criticalGaps.length} critical gap${criticalGaps.length > 1 ? "s" : ""} immediately — these represent required HIPAA controls with zero compliance.`
    );
  }

  if (highGaps.length > 0) {
    recs.push(
      `Remediate ${highGaps.length} high-priority gap${highGaps.length > 1 ? "s" : ""} within 30 days to reduce breach exposure.`
    );
  }

  // Category-specific recommendations
  const adminGaps = gaps.filter((g) => g.category === "Administrative");
  const techGaps = gaps.filter((g) => g.category === "Technical");

  if (adminGaps.length > 3) {
    recs.push(
      "Administrative safeguards have significant gaps — prioritize security awareness training and access management policies."
    );
  }

  if (techGaps.length > 2) {
    recs.push(
      "Technical safeguards need attention — deploy Kaelus AI firewall for real-time PHI interception and audit trail compliance."
    );
  }

  if (score < 60) {
    recs.push(
      "Overall compliance is below 60% — consider engaging a HIPAA compliance consultant alongside Kaelus automated monitoring."
    );
  }

  if (gaps.some((g) => g.controlId === "HIPAA-164.312-b")) {
    recs.push(
      "Audit Controls (§164.312(b)) gap detected — Kaelus automatically logs all AI interactions with PHI for audit compliance."
    );
  }

  if (gaps.some((g) => g.controlId === "HIPAA-164.312-e1")) {
    recs.push(
      "Transmission Security gap — Kaelus blocks PHI before it reaches external AI services, satisfying §164.312(e)(1)."
    );
  }

  return recs;
}
