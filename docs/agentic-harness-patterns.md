# 12 Agentic AI Harness Patterns — HoundShield Implementation Guide
## Applied to the HoundShield CMMC Compliance Firewall
### Version 1.0 | 2026-05-08

---

## Why This Document Exists

These 12 patterns are the difference between an AI feature that works in a demo and one that works in production for a DoD contractor who cannot afford hallucinations, data leaks, or unpredictable behavior. Each pattern maps directly to HoundShield's architecture with concrete implementation code.

---

## Pattern 1 — Persistent Instruction File

**What it is:** A version-controlled file that defines the agent's identity, constraints, and operating rules. Loaded fresh at every session start. Never reconstructed from conversation history.

**Why it matters for HoundShield:** The compliance scanner, Brain AI, and gateway agents must behave identically regardless of which Vercel instance handles the request. Drift in behavior is a CMMC audit failure.

**HoundShield implementation:**

```typescript
// lib/agent/system-prompt.ts

import { readFileSync } from 'fs';
import path from 'path';

const INSTRUCTION_FILE = path.join(process.cwd(), '.claude/agents/compliance-specialist.md');

export function loadSystemPrompt(agentRole: 'scanner' | 'brain' | 'hitl' | 'report'): string {
  // Always read from disk — never cache in memory across requests
  // This ensures prompt updates deploy without code changes
  const base = readFileSync(
    path.join(process.cwd(), `.claude/agents/${agentRole}.md`),
    'utf-8'
  );

  const shared = readFileSync(
    path.join(process.cwd(), '.claude/agents/shared-constraints.md'),
    'utf-8'
  );

  return [shared, base].join('\n\n---\n\n');
}

// Usage in app/api/chat/route.ts:
// const systemPrompt = loadSystemPrompt('brain');
```

**File to create — `.claude/agents/shared-constraints.md`:**
```markdown
# HoundShield Shared Agent Constraints

## Non-Negotiable Rules (apply to all agents)
1. NEVER reproduce, summarize, or paraphrase the content of a blocked prompt
2. NEVER speculate about what a blocked prompt "probably meant"
3. NEVER suggest alternative phrasings that would bypass detection
4. ALWAYS respond in the user's language, not the prompt's language
5. Data boundary: prompt content never leaves the scanning process
6. Uncertainty is not failure — "I cannot determine" is a valid output
7. All outputs must be deterministic for identical inputs (set temperature=0 for classification)
```

---

## Pattern 2 — Scoped Context Assembly

**What it is:** Each agent request gets exactly the context it needs — no more, no less. Context is assembled programmatically, not by accumulating conversation turns.

**Why it matters for HoundShield:** Sending full conversation history to the CMMC classifier wastes tokens and risks leaking prior-turn PII into the current classification context.

**HoundShield implementation:**

```typescript
// lib/agent/context-assembler.ts

import type { ComplianceEvent, PolicyRule } from '@/types/database';

export interface ScanContext {
  promptHash: string;
  destination: string;
  activeRules: PolicyRule[];
  tenantConfig: TenantConfig;
  // NO conversation history — each scan is stateless
}

export interface ReportContext {
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  eventSummary: EventSummary;
  controlGaps: ControlGap[];
  // NO raw prompts — report agent never sees CUI
}

export function assembleScanContext(
  promptHash: string,
  destination: string,
  rules: PolicyRule[],
  tenantConfig: TenantConfig
): ScanContext {
  // Only send active rules relevant to this destination
  const relevantRules = rules.filter(r =>
    r.is_active &&
    (!r.destinations || r.destinations.includes(destination))
  );

  return {
    promptHash,
    destination,
    activeRules: relevantRules,
    tenantConfig,
  };
}

// NEVER do this:
// const context = { ...previousContext, newData }
// Each request gets a fresh, purpose-built context object
```

---

## Pattern 3 — Tiered Memory

**What it is:** Three tiers of storage with different lifetimes, access speeds, and security levels.

```
Tier 1 — Hot (in-request):     Request-scoped variables, never persisted
Tier 2 — Warm (session/edge):  Redis/KV, 1-hour TTL, no PII
Tier 3 — Cold (database):      Supabase, permanent, RLS-protected, audit-logged
```

**HoundShield implementation:**

```typescript
// lib/memory/tiered-memory.ts

import { kv } from '@vercel/kv';  // Tier 2
import { createServiceClient } from '@/lib/supabase/client';  // Tier 3

// Tier 1: Request-scoped (just a typed object, no infrastructure)
export interface HotMemory {
  requestId: string;
  userId: string;
  scanStartMs: number;
  classifications: string[];
  // Dies when the request ends
}

// Tier 2: Session/edge cache (Redis KV)
export async function getWarmMemory<T>(key: string): Promise<T | null> {
  try {
    return await kv.get<T>(`hs:${key}`);
  } catch {
    return null; // Tier 2 miss is not an error — fall through to Tier 3
  }
}

export async function setWarmMemory<T>(
  key: string,
  value: T,
  ttlSeconds = 3600
): Promise<void> {
  await kv.setex(`hs:${key}`, ttlSeconds, value);
}

// Tier 3: Permanent database storage
export async function writeColdMemory(event: ComplianceEvent): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('compliance_events')
    .insert(event);
  if (error) throw new Error(`Cold write failed: ${error.message}`);
}

// Lookup pattern: Hot → Warm → Cold
export async function getUserTier(userId: string): Promise<string> {
  // Check warm cache first
  const cached = await getWarmMemory<string>(`tier:${userId}`);
  if (cached) return cached;

  // Fall to cold storage
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', userId)
    .single();

  const tier = data?.tier ?? 'free';

  // Warm up cache for next request
  await setWarmMemory(`tier:${userId}`, tier, 300); // 5-min TTL

  return tier;
}
```

---

## Pattern 4 — Dream Consolidation

**What it is:** After a session or batch of agent runs, a background job synthesizes patterns, updates the knowledge graph, and prunes stale entries. Like REM sleep — the agent "consolidates" what it learned.

**Why it matters for HoundShield:** The Brain AI knowledge graph must stay current with new CMMC advisories, competitor moves, and customer patterns — without requiring manual updates.

**HoundShield implementation:**

```typescript
// lib/brain-ai/consolidation-job.ts
// Run via: Vercel Cron at 3 AM daily

import { knowledgeGraph } from './knowledge-graph';
import { createServiceClient } from '@/lib/supabase/client';

export async function runDreamConsolidation(): Promise<ConsolidationReport> {
  const supabase = createServiceClient();
  const report: ConsolidationReport = { updated: 0, pruned: 0, added: 0 };

  // Step 1: Pull last 24h of compliance events (aggregated — no raw prompts)
  const { data: recentPatterns } = await supabase
    .from('compliance_events')
    .select('classifications, risk_level, destination_provider, created_at')
    .gte('created_at', new Date(Date.now() - 86_400_000).toISOString());

  // Step 2: Identify emerging classification patterns
  const patternFrequency = aggregatePatterns(recentPatterns ?? []);

  // Step 3: Update knowledge graph nodes if frequency exceeds threshold
  for (const [classification, count] of Object.entries(patternFrequency)) {
    if (count > 10) {
      await knowledgeGraph.updateNodeWeight(classification, count);
      report.updated++;
    }
  }

  // Step 4: Prune knowledge graph nodes not seen in 30 days
  const pruned = await knowledgeGraph.pruneStaleNodes(30);
  report.pruned = pruned;

  // Step 5: Ingest any new CMMC advisory URLs from the firecrawl updater
  const { updated } = await firecrawlUpdater.ingestPendingURLs();
  report.added = updated;

  // Step 6: Write consolidation log
  await supabase.from('brain_consolidation_log').insert({
    run_at: new Date().toISOString(),
    ...report,
  });

  return report;
}

// Vercel Cron handler — app/api/cron/consolidate/route.ts
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  const result = await runDreamConsolidation();
  return Response.json(result);
}
```

**Add to `vercel.json`:**
```json
{
  "crons": [
    { "path": "/api/cron/consolidate", "schedule": "0 3 * * *" }
  ]
}
```

---

## Pattern 5 — Progressive Context Compaction

**What it is:** As a conversation grows, older turns are summarized and replaced with compressed summaries. Only the most recent N turns stay verbatim. Context window stays bounded regardless of conversation length.

**HoundShield implementation (Brain AI chat):**

```typescript
// lib/agent/context-compactor.ts

const MAX_VERBATIM_TURNS = 6;     // keep last 6 turns full
const SUMMARY_TARGET_TOKENS = 200; // compress older turns to ~200 tokens

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
  tokenCount: number;
}

export interface CompactedContext {
  summary?: string;         // compressed older turns
  recentTurns: ChatTurn[];  // verbatim recent turns
  totalTokens: number;
}

export async function compactContext(
  turns: ChatTurn[],
  summaryModel = 'google/gemini-flash-1.5'
): Promise<CompactedContext> {
  if (turns.length <= MAX_VERBATIM_TURNS) {
    // No compaction needed
    return {
      recentTurns: turns,
      totalTokens: turns.reduce((sum, t) => sum + t.tokenCount, 0),
    };
  }

  const olderTurns = turns.slice(0, -MAX_VERBATIM_TURNS);
  const recentTurns = turns.slice(-MAX_VERBATIM_TURNS);

  // Summarize older turns using a cheap fast model
  const summaryPrompt = `Summarize this conversation history in ${SUMMARY_TARGET_TOKENS} tokens or less. 
Focus on: decisions made, facts established, open questions.
Never include specific PII or prompt content.

CONVERSATION:
${olderTurns.map(t => `${t.role}: ${t.content}`).join('\n')}`;

  const summary = await callOpenRouter(summaryModel, summaryPrompt, { temperature: 0 });

  return {
    summary,
    recentTurns,
    totalTokens: estimateTokens(summary) +
      recentTurns.reduce((sum, t) => sum + t.tokenCount, 0),
  };
}

// Reconstruct messages array for API call:
export function buildMessages(ctx: CompactedContext): Array<{role: string; content: string}> {
  const messages = [];
  if (ctx.summary) {
    messages.push({
      role: 'system' as const,
      content: `[CONVERSATION SUMMARY]\n${ctx.summary}`,
    });
  }
  messages.push(...ctx.recentTurns.map(t => ({ role: t.role, content: t.content })));
  return messages;
}
```

---

## Pattern 6 — Explore → Plan → Act Loop

**What it is:** The agent never jumps straight to action. It first explores (gathers context), then plans (produces a structured plan with steps and risks), then acts (executes with verification). Each phase is a separate LLM call with separate prompts.

**Why it matters for HoundShield:** The HITL approval flow and the Brain AI recommendation engine must show their reasoning. A scanner that blocks a prompt and can't explain why is worse than no scanner.

**HoundShield implementation:**

```typescript
// lib/agent/orchestrator.ts

export async function runExploreActLoop(
  input: AgentInput,
  tools: Tool[]
): Promise<AgentResult> {
  // Phase 1: EXPLORE — gather context, don't act yet
  const exploration = await llmCall({
    systemPrompt: EXPLORE_PROMPT,
    userMessage: `Gather context for: ${input.task}`,
    tools: tools.filter(t => t.category === 'read-only'),
    temperature: 0.3,
  });

  // Phase 2: PLAN — produce structured plan, don't execute yet
  const plan = await llmCall({
    systemPrompt: PLAN_PROMPT,
    userMessage: `Based on this exploration:\n${exploration.text}\n\nCreate a step-by-step plan.`,
    tools: [], // No tools in planning phase — thinking only
    temperature: 0,
    responseFormat: 'json', // Enforce structured output
  });

  const parsedPlan = PlanSchema.parse(JSON.parse(plan.text));

  // Risk gate — if plan risk score > threshold, require HITL approval
  if (parsedPlan.riskScore > 0.7) {
    await createHITLApproval({
      operationType: 'HIGH_RISK_ACTION',
      operationDetails: parsedPlan,
      requestedBy: input.userId,
    });
    return { status: 'pending_approval', plan: parsedPlan };
  }

  // Phase 3: ACT — execute the plan step by step with verification
  const results: StepResult[] = [];
  for (const step of parsedPlan.steps) {
    const result = await executeStep(step, tools, exploration);
    results.push(result);

    // Verify each step before proceeding
    if (!result.success) {
      return {
        status: 'failed',
        failedStep: step,
        completedSteps: results,
        plan: parsedPlan,
      };
    }
  }

  return { status: 'completed', results, plan: parsedPlan };
}
```

---

## Pattern 7 — Context-Isolated Subagents

**What it is:** Each subagent gets only the context it needs for its specific task. Subagents cannot read each other's context or outputs. The orchestrator controls all information flow.

**Why it matters for HoundShield:** The report-generation agent must never see the raw prompts that the scanner agent evaluated. The scanner agent must never know the user's subscription tier (that's the gateway's concern).

**HoundShield implementation:**

```typescript
// .claude/agents/ — each agent file is a strict context boundary

// Orchestrator: controls what each subagent sees
async function runCompliancePipeline(rawPrompt: string, userId: string) {
  // Step 1: Scanner subagent — sees ONLY the hash, never the raw prompt
  const promptHash = await hashPrompt(rawPrompt);
  const scanResult = await invokeSubagent('scanner', {
    promptHash,                  // ✓ hash only
    destinationProvider: 'openai',
    activeRules: await loadRules(),
    // userId: NEVER passed to scanner — scanner is stateless
  });

  // Step 2: Gateway subagent — sees scan result + user tier, not the raw prompt
  const userTier = await getUserTier(userId);
  const gatewayDecision = await invokeSubagent('gateway', {
    scanResult,   // ✓ result only
    userTier,     // ✓ tier only
    // promptHash: not needed here
    // rawPrompt: NEVER
  });

  // Step 3: Audit subagent — sees decision + hash, writes compliance event
  if (gatewayDecision.action !== 'ALLOWED') {
    await invokeSubagent('auditor', {
      promptHash,
      scanResult,
      gatewayDecision,
      userId,
      // rawPrompt: NEVER — auditor stores hash only
    });
  }

  return gatewayDecision;
}

// Each subagent invocation gets a fresh context object — never shared refs
async function invokeSubagent(name: AgentName, context: unknown): Promise<unknown> {
  const systemPrompt = loadSystemPrompt(name);
  // Deep clone to prevent context pollution between subagents
  const isolatedContext = JSON.parse(JSON.stringify(context));
  return await llmCall({ systemPrompt, context: isolatedContext });
}
```

---

## Pattern 8 — Fork-Join Parallelism

**What it is:** Independent subtasks run in parallel, then results are joined. Never run sequentially what can run in parallel.

**Why it matters for HoundShield:** The <10ms scan target requires parallel pattern matching. Running 16 regex rules sequentially would take 4-8ms per rule → 64-128ms total. Parallel → ~8ms.

**HoundShield implementation:**

```typescript
// lib/classifier/risk-engine.ts

export async function runParallelClassification(
  text: string,
  rules: PolicyRule[]
): Promise<ClassificationResult> {
  // Group rules by type for parallel execution
  const ruleGroups = {
    regex: rules.filter(r => r.pattern_type === 'REGEX'),
    keyword: rules.filter(r => r.pattern_type === 'KEYWORD'),
    semantic: rules.filter(r => r.pattern_type === 'SEMANTIC'),
  };

  // Fork: all three classification passes run in parallel
  const [regexMatches, keywordMatches, semanticMatches] = await Promise.all([
    runRegexPass(text, ruleGroups.regex),
    runKeywordPass(text, ruleGroups.keyword),
    runSemanticPass(text, ruleGroups.semantic),  // LLM call — most expensive
  ]);

  // Join: merge results, deduplicate, resolve conflicts
  const allMatches = [...regexMatches, ...keywordMatches, ...semanticMatches];
  const highestRisk = resolveRiskLevel(allMatches);
  const action = resolveAction(allMatches);

  return {
    matches: deduplicateMatches(allMatches),
    riskLevel: highestRisk,
    action,
    processingTimeMs: performance.now(),
  };
}

// Brain AI: parallel context retrieval
export async function parallelBrainLookup(query: string) {
  const [cmmcControls, competitorIntel, customerPatterns] = await Promise.all([
    lookupCMMCControls(query),
    lookupCompetitorData(query),
    lookupCustomerPatterns(query),
  ]);

  return { cmmcControls, competitorIntel, customerPatterns };
}
```

---

## Pattern 9 — Progressive Tool Expansion

**What it is:** Agents start with a minimal tool set. Tools are unlocked progressively as risk level and user tier increase. A free-tier user's agent never gets access to the tools a paid tier's agent has.

**HoundShield implementation:**

```typescript
// lib/agent/tool-registry.ts

export type ToolTier = 'free' | 'pro' | 'enterprise' | 'service';

const TOOL_MANIFEST: Record<string, { minTier: ToolTier; riskScore: number }> = {
  'scan:basic':           { minTier: 'free',       riskScore: 0.0 },
  'scan:cmmc':            { minTier: 'pro',         riskScore: 0.1 },
  'report:generate':      { minTier: 'pro',         riskScore: 0.2 },
  'gateway:intercept':    { minTier: 'pro',         riskScore: 0.3 },
  'brain:query':          { minTier: 'pro',         riskScore: 0.2 },
  'policy:update':        { minTier: 'enterprise',  riskScore: 0.7 },
  'quarantine:release':   { minTier: 'enterprise',  riskScore: 0.8 },
  'admin:user-list':      { minTier: 'service',     riskScore: 0.9 },
  'admin:all-data':       { minTier: 'service',     riskScore: 1.0 },
};

const TIER_RANK: Record<ToolTier, number> = {
  free: 0, pro: 1, enterprise: 2, service: 3
};

export function getAvailableTools(userTier: ToolTier): Tool[] {
  const userRank = TIER_RANK[userTier];
  return Object.entries(TOOL_MANIFEST)
    .filter(([, config]) => TIER_RANK[config.minTier] <= userRank)
    .map(([name]) => loadTool(name));
}

// Usage in app/api/agent/execute/route.ts:
// const tools = getAvailableTools(user.tier as ToolTier);
// const result = await runExploreActLoop(input, tools);
```

---

## Pattern 10 — Command Risk Classification

**What it is:** Every tool call and agent action is assigned a risk score before execution. High-risk commands require confirmation or HITL approval. Irreversible actions require the highest approval tier.

**HoundShield implementation:**

```typescript
// lib/agent/risk-classifier.ts

export type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

export interface CommandRisk {
  level: RiskLevel;
  score: number;       // 0.0 – 1.0
  reversible: boolean;
  requiresHITL: boolean;
  rationale: string;
}

const COMMAND_RISK_TABLE: Record<string, CommandRisk> = {
  // Read operations — always safe
  'compliance_events.select':  { level: 'safe',     score: 0.0, reversible: true,  requiresHITL: false, rationale: 'Read-only' },
  'brain.query':               { level: 'safe',     score: 0.1, reversible: true,  requiresHITL: false, rationale: 'Read-only' },

  // Write operations — low-medium risk
  'compliance_events.insert':  { level: 'low',      score: 0.2, reversible: true,  requiresHITL: false, rationale: 'Appendable audit log' },
  'profiles.update':           { level: 'medium',   score: 0.4, reversible: true,  requiresHITL: false, rationale: 'User data change' },

  // Policy changes — high risk
  'policy_rules.update':       { level: 'high',     score: 0.7, reversible: true,  requiresHITL: true,  rationale: 'Changes scanning behavior for all users' },
  'quarantine.release':        { level: 'high',     score: 0.8, reversible: false, requiresHITL: true,  rationale: 'Releases potentially unsafe prompt' },

  // Destructive operations — critical
  'user.delete':               { level: 'critical', score: 0.95, reversible: false, requiresHITL: true, rationale: 'Permanent data deletion' },
  'subscription.cancel':       { level: 'critical', score: 0.9,  reversible: false, requiresHITL: true, rationale: 'Revenue impact + data changes' },
};

export async function executeWithRiskCheck(
  command: string,
  executor: () => Promise<unknown>,
  userId: string
): Promise<unknown> {
  const risk = COMMAND_RISK_TABLE[command] ?? { level: 'high', score: 0.8, requiresHITL: true };

  if (risk.requiresHITL) {
    await createHITLApproval({
      operationType: command,
      requestedBy: userId,
      riskAssessment: `${risk.level} (${risk.score}) — ${risk.rationale}`,
    });
    throw new HITLPendingError(command);
  }

  return executor();
}
```

---

## Pattern 11 — Single-Purpose Tool Design

**What it is:** Each tool does exactly one thing. No tool has side effects beyond its declared purpose. Tools are composable — the orchestrator combines them, not the tools themselves.

**Anti-pattern (what NOT to do):**
```typescript
// BAD: One tool that does 5 things
async function scanAndLogAndAlertAndUpdateAndNotify(prompt: string) { ... }
```

**HoundShield implementation:**

```typescript
// lib/agent/tools/index.ts — each tool is a single pure function

export const TOOLS = {
  // ✓ One tool, one job
  scanPrompt: {
    name: 'scan_prompt',
    description: 'Classify a prompt hash against active policy rules. Returns risk level and matched rules only.',
    parameters: ScanPromptSchema,
    execute: async ({ promptHash, rules }: ScanInput): Promise<ScanOutput> => {
      return runParallelClassification(promptHash, rules);
    },
  },

  logComplianceEvent: {
    name: 'log_compliance_event',
    description: 'Write a compliance event to the audit log. Does not scan, does not alert.',
    parameters: LogEventSchema,
    execute: async (event: ComplianceEvent): Promise<{ id: string }> => {
      return writeColdMemory(event);
    },
  },

  generateReport: {
    name: 'generate_report',
    description: 'Generate a compliance PDF for a specific user and date range. Does not modify any data.',
    parameters: GenerateReportSchema,
    execute: async (params: ReportParams): Promise<{ url: string }> => {
      return generatePDFReport(params);
    },
  },

  queryBrain: {
    name: 'query_brain',
    description: 'Query the CMMC knowledge graph. Read-only. Returns relevant control mappings and recommendations.',
    parameters: BrainQuerySchema,
    execute: async ({ query }: { query: string }): Promise<BrainResult> => {
      return brainQuery(query);
    },
  },

  // The orchestrator combines tools — tools never call each other directly
} satisfies Record<string, Tool>;
```

---

## Pattern 12 — Deterministic Lifecycle Hooks

**What it is:** Pre-defined hooks fire at fixed points in the agent lifecycle (before tool call, after tool call, on error, on completion). Hooks are deterministic — they always fire, always in order, and their failures don't silently swallow errors.

**Why it matters for HoundShield:** CMMC requires an audit trail. Every agent action must be logged, timed, and integrity-anchored — not just when things go right, but especially when they fail.

**HoundShield implementation:**

```typescript
// lib/agent/lifecycle.ts

export interface AgentHooks {
  onStart?: (ctx: AgentContext) => Promise<void>;
  onToolCall?: (tool: string, input: unknown) => Promise<void>;
  onToolResult?: (tool: string, result: unknown, durationMs: number) => Promise<void>;
  onError?: (error: Error, ctx: AgentContext) => Promise<void>;
  onComplete?: (result: AgentResult, ctx: AgentContext) => Promise<void>;
}

// Production hooks — always active in HoundShield
export const HOUNDSHIELD_HOOKS: AgentHooks = {
  onStart: async (ctx) => {
    // Write span start to observability pipeline
    await startSpan({
      traceId: ctx.traceId,
      spanId: ctx.spanId,
      agentName: ctx.agentName,
      userId: ctx.userId,
      startMs: Date.now(),
    });
  },

  onToolCall: async (tool, input) => {
    // Log tool invocation — never log the raw input content (may contain PII)
    await logToolInvocation({
      tool,
      inputHash: hashObject(input),
      timestampMs: Date.now(),
    });
  },

  onToolResult: async (tool, result, durationMs) => {
    // Track latency per tool for cost/performance optimization
    await recordToolMetric({ tool, durationMs, success: true });
  },

  onError: async (error, ctx) => {
    // Errors MUST be logged — never swallowed
    await recordSpanError({
      traceId: ctx.traceId,
      error: error.message,
      stack: error.stack,
      timestampMs: Date.now(),
    });

    // Alert if error rate exceeds threshold
    await checkErrorRateAlert(ctx.agentName, error);
  },

  onComplete: async (result, ctx) => {
    // Close span + write integrity anchor
    await closeSpan({
      traceId: ctx.traceId,
      durationMs: Date.now() - ctx.startMs,
      outputHash: hashObject(result),
      status: result.status,
    });

    // Write seed anchor for audit trail integrity
    await writeSeedAnchor({
      entityType: 'AGENT_RUN',
      entityId: ctx.traceId,
      contentHash: hashObject({ input: ctx.inputHash, output: hashObject(result) }),
    });
  },
};

// Wrap any agent run with lifecycle hooks
export async function withLifecycle<T>(
  ctx: AgentContext,
  fn: () => Promise<T>,
  hooks: AgentHooks = HOUNDSHIELD_HOOKS
): Promise<T> {
  await hooks.onStart?.(ctx);
  try {
    const result = await fn();
    await hooks.onComplete?.(result as AgentResult, ctx);
    return result;
  } catch (error) {
    await hooks.onError?.(error as Error, ctx);
    throw error; // NEVER swallow — re-throw always
  }
}
```

---

## Pattern Summary — HoundShield Mapping

| Pattern | HoundShield Component | File |
|---|---|---|
| 1. Persistent instruction file | Agent system prompts | `.claude/agents/*.md` |
| 2. Scoped context assembly | Scan + report pipeline | `lib/agent/context-assembler.ts` |
| 3. Tiered memory | Hot/KV/Supabase | `lib/memory/tiered-memory.ts` |
| 4. Dream consolidation | Brain AI cron job | `lib/brain-ai/consolidation-job.ts` |
| 5. Progressive compaction | Brain AI chat | `lib/agent/context-compactor.ts` |
| 6. Explore → Plan → Act | HITL + Brain AI | `lib/agent/orchestrator.ts` |
| 7. Context-isolated subagents | Scanner/Gateway/Auditor | `lib/agent/orchestrator.ts` |
| 8. Fork-join parallelism | Risk engine | `lib/classifier/risk-engine.ts` |
| 9. Progressive tool expansion | Tier-gated tools | `lib/agent/tool-registry.ts` |
| 10. Command risk classification | HITL approval gate | `lib/agent/risk-classifier.ts` |
| 11. Single-purpose tool design | Tool definitions | `lib/agent/tools/index.ts` |
| 12. Deterministic lifecycle hooks | Observability pipeline | `lib/agent/lifecycle.ts` |
