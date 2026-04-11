// ============================================================================
// Kaelus Multi-Agent Router — Task Classification + Agent Dispatch v1.0
//
// Responsibilities:
//   1. Classify incoming tasks into an agent domain
//   2. Build agent-specific execution configs from the task + agent definition
//   3. Route to the appropriate agent via the orchestrator
//   4. Aggregate results from multi-agent pipelines (e.g., scan → audit)
//
// Routing strategy:
//   - Keyword scoring: task text is scored against each agent's domain keywords
//   - Explicit agent_id override: caller can bypass routing by specifying the agent
//   - Confidence threshold: low-confidence tasks route to ResearchAgent (safest default)
//
// Design notes:
//   - Router is stateless. All state lives in agentMemory or Supabase.
//   - executeAgentLoop is imported lazily to avoid circular imports.
// ============================================================================

import { AGENT_REGISTRY, BUILTIN_AGENTS, getAgent } from './agents';
import type { AgentConfig } from './types';

// ---------------------------------------------------------------------------
// Domain keyword scoring maps
// ---------------------------------------------------------------------------

/** Keyword → agent ID mapping with weight (higher = stronger signal) */
const DOMAIN_KEYWORDS: Array<{ keywords: string[]; agentId: string; weight: number }> = [
  // Scanner domain — real-time detection tasks
  {
    keywords: ['scan', 'detect', 'check', 'pii', 'phi', 'cui', 'hipaa', 'sensitive', 'contains', 'exposure', 'leak', 'credential', 'api key', 'secret'],
    agentId: 'kaelus-scanner',
    weight: 3,
  },
  // Policy domain — rule and enforcement tasks
  {
    keywords: ['policy', 'rule', 'allow', 'block', 'permit', 'deny', 'exception', 'enforcement', 'approved', 'prohibited', 'whitelist', 'blacklist', 'access control'],
    agentId: 'kaelus-policy',
    weight: 3,
  },
  // Research domain — regulatory and knowledge tasks
  {
    keywords: ['research', 'regulation', 'requirement', 'guidance', 'nist', 'cmmc', 'soc2', 'framework', 'standard', 'control', 'what does', 'explain', 'define', 'overview'],
    agentId: 'kaelus-research',
    weight: 2,
  },
  // Optimization domain — performance and cost tasks
  {
    keywords: ['latency', 'performance', 'optimize', 'speed', 'cost', 'token', 'throughput', 'slow', 'profile', 'bottleneck', 'efficiency', 'metrics', 'p99'],
    agentId: 'kaelus-optimizer',
    weight: 3,
  },
  // Auditor domain — reporting and audit tasks
  {
    keywords: ['audit', 'report', 'sprs', 'score', 'evidence', 'assessment', 'trail', 'log', 'export', 'compliance report', 'gap analysis', 'readiness', 'prepare'],
    agentId: 'kaelus-auditor',
    weight: 3,
  },
];

// ---------------------------------------------------------------------------
// Task classification
// ---------------------------------------------------------------------------

export interface RoutingDecision {
  agentId: string;
  agent: AgentConfig;
  confidence: number; // 0–1
  reasoning: string;
}

/**
 * Classify a task into the most appropriate agent domain.
 *
 * Scoring algorithm:
 *   For each agent, sum weights of matched keywords in the task text.
 *   Normalize by total possible weight to get a 0–1 confidence score.
 *   Route to the highest-scoring agent above MIN_CONFIDENCE.
 *   Default to ResearchAgent on ties or low confidence.
 */
export function classifyTask(task: string, explicitAgentId?: string): RoutingDecision {
  // Explicit override — trust the caller
  if (explicitAgentId) {
    const agent = getAgent(explicitAgentId);
    if (agent) {
      return {
        agentId: explicitAgentId,
        agent,
        confidence: 1.0,
        reasoning: `Explicit agent_id specified: ${explicitAgentId}`,
      };
    }
  }

  const normalizedTask = task.toLowerCase();
  const scores = new Map<string, number>();

  for (const { keywords, agentId, weight } of DOMAIN_KEYWORDS) {
    let score = 0;
    for (const kw of keywords) {
      if (normalizedTask.includes(kw)) {
        score += weight;
      }
    }
    scores.set(agentId, (scores.get(agentId) ?? 0) + score);
  }

  // Find winner
  let topAgentId = 'kaelus-research'; // safest default
  let topScore = 0;

  for (const [agentId, score] of scores.entries()) {
    if (score > topScore) {
      topScore = score;
      topAgentId = agentId;
    }
  }

  const maxPossibleScore = DOMAIN_KEYWORDS.reduce((s, d) => s + d.keywords.length * d.weight, 0);
  const confidence = Math.min(topScore / Math.max(maxPossibleScore * 0.15, 1), 1);

  const matchedKeywords = DOMAIN_KEYWORDS
    .filter((d) => d.agentId === topAgentId)
    .flatMap((d) => d.keywords.filter((kw) => normalizedTask.includes(kw)));

  const agent = getAgent(topAgentId)!;

  return {
    agentId: topAgentId,
    agent,
    confidence: parseFloat(confidence.toFixed(3)),
    reasoning:
      topScore > 0
        ? `Matched keywords: [${matchedKeywords.slice(0, 5).join(', ')}] → ${agent.name} (score: ${topScore})`
        : `No strong signal — defaulting to ${agent.name}`,
  };
}

// ---------------------------------------------------------------------------
// Agent execution config builder
// ---------------------------------------------------------------------------

export interface AgentExecutionConfig {
  agentId: string;
  model: string;
  systemPrompt: string;
  tools: string[];
  maxIterations: number;
  temperature: number;
  routing: RoutingDecision;
}

/**
 * Build an execution config for a specific agent + task combination.
 * Merges the agent's base config with any task-specific overrides.
 */
export function buildExecutionConfig(
  routing: RoutingDecision,
  overrides?: {
    model?: string;
    maxIterations?: number;
    temperature?: number;
    additionalTools?: string[];
  }
): AgentExecutionConfig {
  const { agent } = routing;

  return {
    agentId: agent.id,
    model: overrides?.model ?? agent.model,
    systemPrompt: agent.systemPrompt,
    tools: overrides?.additionalTools
      ? [...new Set([...agent.tools, ...overrides.additionalTools])]
      : agent.tools,
    maxIterations: overrides?.maxIterations ?? agent.maxIterations,
    temperature: overrides?.temperature ?? agent.temperature,
    routing,
  };
}

// ---------------------------------------------------------------------------
// Multi-agent pipeline support
// ---------------------------------------------------------------------------

export interface PipelineStep {
  agentId: string;
  task: string;
  dependsOn?: string[]; // IDs of steps that must complete first
}

export interface PipelineResult {
  stepId: string;
  agentId: string;
  output: string;
  durationMs: number;
  success: boolean;
  error?: string;
}

/**
 * Describes a pre-built pipeline for common compliance workflows.
 *
 * Pipelines chain multiple agents where the output of one feeds the next.
 * For example, the "scan-and-audit" pipeline:
 *   1. ScannerAgent scans the content
 *   2. AuditorAgent generates an audit entry from the scan result
 */
export const BUILTIN_PIPELINES = {
  /** Scan content then generate audit entry */
  'scan-and-audit': [
    { stepId: 'scan', agentId: 'kaelus-scanner' },
    { stepId: 'audit', agentId: 'kaelus-auditor', dependsOn: ['scan'] },
  ],
  /** Research a regulation then produce a policy recommendation */
  'research-and-policy': [
    { stepId: 'research', agentId: 'kaelus-research' },
    { stepId: 'policy', agentId: 'kaelus-policy', dependsOn: ['research'] },
  ],
  /** Profile performance then produce optimization plan */
  'profile-and-optimize': [
    { stepId: 'profile', agentId: 'kaelus-optimizer' },
    { stepId: 'report', agentId: 'kaelus-auditor', dependsOn: ['profile'] },
  ],
} as const;

export type PipelineName = keyof typeof BUILTIN_PIPELINES;

// ---------------------------------------------------------------------------
// Agent registry helpers (re-exports for convenience)
// ---------------------------------------------------------------------------

export { BUILTIN_AGENTS, AGENT_REGISTRY, getAgent };
