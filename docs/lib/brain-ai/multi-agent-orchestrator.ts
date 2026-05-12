/**
 * Brain AI v3 — MultiAgentOrchestrator
 *
 * Routes compliance queries to the correct specialist agent.
 * CMMC-first: routes to CMCCAgent by default.
 * Security queries → SecurityAgent.
 * HIPAA/SOC2/Market stubs throw until $10K MRR.
 *
 * Pattern: gstack 23-agent orchestration applied to compliance domain.
 */

import {
  CMCCAgent,
  SecurityAgent,
  HIPAAAgent,
  SOC2Agent,
  MarketAgent,
  type AgentQuery,
  type AgentResult,
} from "./specialist-agents";

export type ComplianceFramework = "cmmc" | "hipaa" | "soc2" | "security" | "market";

export interface OrchestratorQuery extends AgentQuery {
  compliance_framework?: ComplianceFramework;
}

export interface OrchestratorResult extends AgentResult {
  framework: ComplianceFramework;
}

function detectFramework(query: string, explicit?: ComplianceFramework): ComplianceFramework {
  if (explicit) return explicit;
  const q = query.toLowerCase();
  if (/hipaa|phi|protected health|baa|covered entity/i.test(q)) return "hipaa";
  if (/soc\s?2|soc2|type ii|trust service/i.test(q)) return "soc2";
  if (/threat|cve|vulnerability|pentest|injection|sql|xss|csrf|owasp/i.test(q)) return "security";
  if (/competitor|pricing|nightfall|strac|cloudflare|market/i.test(q)) return "market";
  return "cmmc";
}

export class MultiAgentOrchestrator {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.OPENROUTER_API_KEY ?? "";
  }

  async orchestrate(query: OrchestratorQuery): Promise<OrchestratorResult> {
    const framework = detectFramework(query.query, query.compliance_framework);
    const agentQuery: AgentQuery = { ...query, apiKey: this.apiKey };

    let result: AgentResult;

    switch (framework) {
      case "cmmc":
        result = await new CMCCAgent(this.apiKey).run(agentQuery);
        break;
      case "security":
        result = await new SecurityAgent(this.apiKey).run(agentQuery);
        break;
      case "hipaa":
        result = await new HIPAAAgent().run(agentQuery);
        break;
      case "soc2":
        result = await new SOC2Agent().run(agentQuery);
        break;
      case "market":
        result = await new MarketAgent().run(agentQuery);
        break;
      default:
        result = await new CMCCAgent(this.apiKey).run(agentQuery);
    }

    return { ...result, framework };
  }
}
