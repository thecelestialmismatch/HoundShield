/**
 * API Security Checklist Generator
 *
 * Generates structured security checklists for API endpoints.
 * Covers: auth, business logic, input validation — OWASP API Top 10 + NIST 800-171.
 * Delegates to SecurityAdvisor (Brain AI v3).
 */

import { SecurityAdvisor } from "@/lib/brain-ai/security-advisor";
import type {
  SecurityChecklistInput,
  SecurityChecklist,
  LogicVulnerabilities,
} from "@/lib/brain-ai/security-advisor";

export type { SecurityChecklistInput, SecurityChecklist, LogicVulnerabilities };

export async function generateApiSecurityChecklist(
  input: SecurityChecklistInput,
): Promise<SecurityChecklist> {
  const advisor = new SecurityAdvisor(process.env.OPENROUTER_API_KEY);
  return advisor.apiSecurityChecklist(input);
}

export async function huntBusinessLogic(
  featureDescription: string,
): Promise<LogicVulnerabilities> {
  const advisor = new SecurityAdvisor(process.env.OPENROUTER_API_KEY);
  return advisor.businessLogicHunter(featureDescription);
}

export function checklistRiskSummary(checklist: SecurityChecklist): string {
  const total =
    checklist.authChecks.length +
    checklist.logicChecks.length +
    checklist.inputChecks.length;

  return `Risk: ${checklist.riskLevel.toUpperCase()} | ${total} checks | ${checklist.recommendations.length} recommendations`;
}
