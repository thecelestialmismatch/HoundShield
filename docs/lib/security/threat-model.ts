/**
 * Threat Model Generator
 *
 * Generates STRIDE threat models for a given technology stack.
 * Delegates to SecurityAdvisor (Brain AI v3 SecurityAgent under the hood).
 */

import { SecurityAdvisor } from "@/lib/brain-ai/security-advisor";
import type { ThreatModelInput, ThreatModel } from "@/lib/brain-ai/security-advisor";

export type { ThreatModelInput, ThreatModel };

export async function generateThreatModel(input: ThreatModelInput): Promise<ThreatModel> {
  const advisor = new SecurityAdvisor(process.env.OPENROUTER_API_KEY);
  return advisor.threatModel(input);
}

export function threatModelSummary(model: ThreatModel): string {
  const critical = model.threatsBySeverity.filter((t) => t.severity === "critical");
  const high = model.threatsBySeverity.filter((t) => t.severity === "high");

  const lines: string[] = [
    `Attack surface: ${model.attackSurface.length} vectors`,
    `Threats: ${critical.length} critical, ${high.length} high`,
    `Test first: ${model.testFirst.slice(0, 3).join(", ")}`,
    `NIST controls mapped: ${model.nistControls.join(", ")}`,
  ];

  return lines.join("\n");
}
