/**
 * Brain AI v3 — TruthVerifier
 *
 * Cross-checks AI-generated compliance claims against the KnowledgeGraph.
 * Flags claims with confidence < 0.85 as "needs verify".
 * Prevents hallucinated NIST control numbers and wrong SPRS weights.
 *
 * Pattern: ruflo Truth Verification System applied to compliance claims.
 */

import { queryKnowledgeGraph } from "./knowledge-graph";
import type { KnowledgeDomain } from "./knowledge-graph";

export interface ComplianceClaim {
  text: string;
  controlNumber?: string;
  domain?: string;
}

export interface VerificationResult {
  claim: ComplianceClaim;
  verified: boolean;
  confidence: number;
  supportingNode?: string;
  flag: "verified" | "needs_verify" | "likely_hallucinated";
  note?: string;
}

export interface VerificationReport {
  results: VerificationResult[];
  allVerified: boolean;
  flaggedCount: number;
}

// NIST 800-171 Rev 2 authoritative control numbers (14 domains, 110 controls)
// Source: NIST SP 800-171 Rev 2, csrc.nist.gov/publications/detail/sp/800-171/rev-2/final
const VALID_NIST_CONTROLS = new Set([
  "3.1.1","3.1.2","3.1.3","3.1.4","3.1.5","3.1.6","3.1.7","3.1.8","3.1.9","3.1.10",
  "3.1.11","3.1.12","3.1.13","3.1.14","3.1.15","3.1.16","3.1.17","3.1.18","3.1.19","3.1.20",
  "3.1.21","3.1.22",
  "3.2.1","3.2.2","3.2.3",
  "3.3.1","3.3.2","3.3.3","3.3.4","3.3.5","3.3.6","3.3.7","3.3.8","3.3.9",
  "3.4.1","3.4.2","3.4.3","3.4.4","3.4.5","3.4.6","3.4.7","3.4.8","3.4.9",
  "3.5.1","3.5.2","3.5.3","3.5.4","3.5.5","3.5.6","3.5.7","3.5.8","3.5.9","3.5.10","3.5.11",
  "3.6.1","3.6.2","3.6.3",
  "3.7.1","3.7.2","3.7.3","3.7.4","3.7.5","3.7.6",
  "3.8.1","3.8.2","3.8.3","3.8.4","3.8.5","3.8.6","3.8.7","3.8.8","3.8.9",
  "3.9.1","3.9.2",
  "3.10.1","3.10.2","3.10.3","3.10.4","3.10.5","3.10.6",
  "3.11.1","3.11.2","3.11.3",
  "3.12.1","3.12.2","3.12.3","3.12.4",
  "3.13.1","3.13.2","3.13.3","3.13.4","3.13.5","3.13.6","3.13.7","3.13.8","3.13.9","3.13.10",
  "3.13.11","3.13.12","3.13.13","3.13.14","3.13.15","3.13.16",
  "3.14.1","3.14.2","3.14.3","3.14.4","3.14.5","3.14.6","3.14.7",
]);

function verifyControlNumber(controlNumber: string): { valid: boolean; note?: string } {
  const normalized = controlNumber.trim();
  if (VALID_NIST_CONTROLS.has(normalized)) return { valid: true };
  if (/^\d+\.\d+\.\d+$/.test(normalized)) {
    return { valid: false, note: `${normalized} is not a valid NIST 800-171 Rev 2 control number` };
  }
  return { valid: false, note: `"${normalized}" is not a recognized NIST control format` };
}

export class TruthVerifier {
  async verifyClaim(claim: ComplianceClaim): Promise<VerificationResult> {
    if (claim.controlNumber) {
      const { valid, note } = verifyControlNumber(claim.controlNumber);
      if (!valid) {
        return { claim, verified: false, confidence: 0.1, flag: "likely_hallucinated", note };
      }
    }

    const domains: KnowledgeDomain[] = claim.domain
      ? [claim.domain as KnowledgeDomain]
      : ["cmmc", "nist"];

    const results = await queryKnowledgeGraph({
      query: claim.controlNumber ? `${claim.controlNumber} ${claim.text}` : claim.text,
      domains,
      limit: 3,
    });

    if (results.length === 0) {
      return {
        claim,
        verified: false,
        confidence: 0.5,
        flag: "needs_verify",
        note: "No KnowledgeGraph evidence — manual verification recommended",
      };
    }

    const topResult = results[0];
    const confidence = Math.min(topResult.score, 1.0);

    return {
      claim,
      verified: confidence >= 0.85,
      confidence,
      supportingNode: topResult.node.id,
      flag: confidence >= 0.85 ? "verified" : "needs_verify",
    };
  }

  async verifyAll(claims: ComplianceClaim[]): Promise<VerificationReport> {
    const results = await Promise.all(claims.map((c) => this.verifyClaim(c)));
    const flaggedCount = results.filter((r) => r.flag !== "verified").length;
    return { results, allVerified: flaggedCount === 0, flaggedCount };
  }

  extractClaims(text: string): ComplianceClaim[] {
    const claims: ComplianceClaim[] = [];
    const controlPattern = /\b(3\.\d+\.\d+)\b/g;
    let match: RegExpExecArray | null;

    while ((match = controlPattern.exec(text)) !== null) {
      const start = Math.max(0, match.index - 100);
      const end = Math.min(text.length, match.index + 100);
      claims.push({ text: text.slice(start, end), controlNumber: match[1], domain: "nist" });
    }

    if (claims.length === 0) claims.push({ text: text.slice(0, 500) });
    return claims;
  }
}
