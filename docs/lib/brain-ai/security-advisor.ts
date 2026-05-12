/**
 * Brain AI v3 — SecurityAdvisor
 *
 * Implements DOCX security analysis prompts as a structured API.
 * Used by SecurityAgent in the multi-agent orchestrator.
 *
 * Prompts sourced from: ALL MY DATA .docx — security testing section.
 * Covers: API security checklist, threat model, business logic hunting,
 * CVE analysis, and authentication review.
 */

import { ReasoningLoop } from "./reasoning-loop";

export interface SecurityChecklistInput {
  endpoint: string;
  method: string;
  auth: string;
  businessFunction: string;
}

export interface SecurityChecklist {
  authChecks: string[];
  logicChecks: string[];
  inputChecks: string[];
  recommendations: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface ThreatModelInput {
  stack: string[];
  authType: string;
  hosting: string;
  dataTypes: string[];
}

export interface ThreatModel {
  attackSurface: string[];
  threatsBySeverity: Array<{ threat: string; severity: "low" | "medium" | "high" | "critical"; mitigation: string }>;
  testFirst: string[];
  nistControls: string[];
}

export interface LogicVulnerabilities {
  vulnerabilities: Array<{ description: string; impact: string; test: string }>;
  bypassScenarios: string[];
}

const API_SECURITY_SYSTEM_PROMPT = `You are a senior application security engineer specializing in API security and CMMC compliance.
Analyze the given endpoint and return a structured security checklist.
Be specific. Reference OWASP API Top 10 and NIST 800-171 controls where applicable.
Format your response as JSON with keys: authChecks, logicChecks, inputChecks, recommendations, riskLevel.`;

const THREAT_MODEL_SYSTEM_PROMPT = `You are a threat modeling expert using STRIDE methodology.
Analyze the given technology stack and return a structured threat model.
Reference specific CVEs or attack patterns where relevant.
Format your response as JSON with keys: attackSurface, threatsBySeverity, testFirst, nistControls.`;

const LOGIC_HUNTER_SYSTEM_PROMPT = `You are a business logic vulnerability specialist.
Analyze the described feature for logic flaws, race conditions, and authorization bypass scenarios.
Think like an attacker. Think about what happens if you change the order of operations, skip steps, or modify request parameters.
Format your response as JSON with keys: vulnerabilities, bypassScenarios.`;

function parseJsonSafe<T>(text: string, fallback: T): T {
  try {
    const match = text.match(/```json\s*([\s\S]*?)```/) ?? text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[1] ?? match[0]) as T;
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

export class SecurityAdvisor {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.OPENROUTER_API_KEY ?? "";
  }

  async apiSecurityChecklist(input: SecurityChecklistInput): Promise<SecurityChecklist> {
    const loop = new ReasoningLoop({
      model: "claude-sonnet-4-6",
      n_iterations: 2,
      apiKey: this.apiKey,
    });

    const query = `Endpoint: ${input.method} ${input.endpoint}
Auth: ${input.auth}
Business function: ${input.businessFunction}

Generate a comprehensive security checklist for this API endpoint.`;

    const result = await loop.run(query);

    return parseJsonSafe<SecurityChecklist>(result.answer, {
      authChecks: ["Verify token expiry", "Check authorization scope", "Test for IDOR"],
      logicChecks: ["Validate business rules server-side", "Check rate limiting"],
      inputChecks: ["Validate all input parameters", "Check for injection vulnerabilities"],
      recommendations: ["Add request signing", "Implement idempotency keys"],
      riskLevel: "medium",
    });
  }

  async threatModel(input: ThreatModelInput): Promise<ThreatModel> {
    const loop = new ReasoningLoop({
      model: "claude-sonnet-4-6",
      n_iterations: 2,
      apiKey: this.apiKey,
    });

    const query = `Stack: ${input.stack.join(", ")}
Auth type: ${input.authType}
Hosting: ${input.hosting}
Data types handled: ${input.dataTypes.join(", ")}

Generate a STRIDE threat model for this system.`;

    const result = await loop.run(query);

    return parseJsonSafe<ThreatModel>(result.answer, {
      attackSurface: ["API endpoints", "Authentication layer", "Data storage"],
      threatsBySeverity: [
        { threat: "Unauthorized access via token theft", severity: "critical", mitigation: "Rotate tokens, use short-lived JWTs" },
      ],
      testFirst: ["Authentication bypass", "Privilege escalation"],
      nistControls: ["3.1.1", "3.5.3", "3.13.8"],
    });
  }

  async businessLogicHunter(featureDescription: string): Promise<LogicVulnerabilities> {
    const loop = new ReasoningLoop({
      model: "claude-sonnet-4-6",
      n_iterations: 2,
      apiKey: this.apiKey,
    });

    const query = `Feature: ${featureDescription}

Hunt for business logic vulnerabilities. Think about:
- What happens if you skip steps?
- What happens if you change the order of operations?
- What happens if you modify values mid-flow?
- Race conditions?
- Authorization gaps between roles?`;

    const result = await loop.run(query);

    return parseJsonSafe<LogicVulnerabilities>(result.answer, {
      vulnerabilities: [],
      bypassScenarios: [],
    });
  }
}
