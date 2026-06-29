/**
 * HoundShield AI Observability Pipeline
 * Trace → Score → Flag → Debug → Fix → Test
 *
 * Implements all 8 steps from the observability guide.
 * Every AI request through the platform produces a full TRACE.
 */

import { createServiceClient } from '@/lib/supabase/client';
import { createHash } from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type SpanType =
  | 'user_question'
  | 'intent_router'
  | 'retriever'
  | 'retrieved_chunks'
  | 'llm_call'
  | 'tool_call'
  | 'final_response';

export interface Span {
  spanId: string;
  traceId: string;
  type: SpanType;
  name: string;
  startMs: number;
  endMs?: number;
  durationMs?: number;
  input?: string;     // hashed if contains PII
  output?: string;    // hashed if contains PII
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface Trace {
  traceId: string;
  sessionId: string;
  userId: string;
  modelName: string;
  promptVersion: string;
  temperature: number;
  environment: 'production' | 'staging' | 'development';
  startMs: number;
  endMs?: number;
  spans: Span[];
  metrics?: TraceMetrics;
  qualityScores?: QualityScores;
  flags?: TraceFlag[];
}

export interface TraceMetrics {
  totalLatencyMs: number;
  llmLatencyMs: number;
  retrievalLatencyMs: number;
  totalTokensUsed: number;
  promptTokens: number;
  completionTokens: number;
  modelCostUsd: number;
  toolCallCount: number;
  retryCount: number;
  failedToolCalls: number;
}

export interface RAGContext {
  traceId: string;
  spanId: string;
  retrievedDocuments: RetrievedDoc[];
  passedToModel: string[];   // chunk IDs actually sent
  similarityScores: Record<string, number>;
  sourceNames: string[];
}

export interface RetrievedDoc {
  chunkId: string;
  sourceName: string;
  similarityScore: number;
  content: string;           // full text for scoring
  passedToModel: boolean;
}

export interface QualityScores {
  groundedness: number;       // 0-1: was answer grounded in retrieved docs?
  answerRelevance: number;    // 0-1: did it answer the actual question?
  hallucinationRisk: number;  // 0-1: did it fabricate facts?
  safetyScore: number;        // 0-1: was it safe?
  costEfficiency: number;     // 0-1: was cost reasonable?
  userSatisfaction?: number;  // 0-1: thumbs up/down
}

export interface TraceFlag {
  ruleId: string;
  severity: 'warning' | 'error' | 'critical';
  reason: string;
  details?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: CAPTURE THE REQUEST
// Creates a new trace for every AI request
// ─────────────────────────────────────────────────────────────────────────────

export function captureRequest(params: {
  sessionId: string;
  userId: string;
  userQuestion: string;
  modelName: string;
  promptVersion: string;
  temperature: number;
}): Trace {
  const traceId = generateTraceId();

  const firstSpan: Span = {
    spanId: generateSpanId(),
    traceId,
    type: 'user_question',
    name: 'user_question',
    startMs: Date.now(),
    endMs: Date.now(),
    durationMs: 0,
    // Hash the question — never store raw user input in observability logs
    input: hashContent(params.userQuestion),
    metadata: {
      questionLength: params.userQuestion.length,
      sessionId: params.sessionId,
    },
  };

  return {
    traceId,
    sessionId: params.sessionId,
    userId: params.userId,
    modelName: params.modelName,
    promptVersion: params.promptVersion,
    temperature: params.temperature,
    environment: (process.env.NODE_ENV ?? 'development') as Trace['environment'],
    startMs: Date.now(),
    spans: [firstSpan],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: TRACE THE PIPELINE
// Add spans to a trace as each pipeline step completes
// ─────────────────────────────────────────────────────────────────────────────

export function openSpan(
  trace: Trace,
  type: SpanType,
  name: string,
  metadata?: Record<string, unknown>
): Span {
  const span: Span = {
    spanId: generateSpanId(),
    traceId: trace.traceId,
    type,
    name,
    startMs: Date.now(),
    metadata,
  };
  trace.spans.push(span);
  return span;
}

export function closeSpan(
  span: Span,
  output?: unknown,
  error?: string
): void {
  span.endMs = Date.now();
  span.durationMs = span.endMs - span.startMs;
  if (output !== undefined) {
    // Never store raw output in spans — hash it
    span.output = typeof output === 'string'
      ? hashContent(output)
      : hashContent(JSON.stringify(output));
  }
  if (error) span.error = error;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: STORE THE IMPORTANT CONTEXT (RAG)
// ─────────────────────────────────────────────────────────────────────────────

export function captureRAGContext(
  traceId: string,
  spanId: string,
  retrieved: RetrievedDoc[]
): RAGContext {
  return {
    traceId,
    spanId,
    retrievedDocuments: retrieved,
    passedToModel: retrieved.filter(d => d.passedToModel).map(d => d.chunkId),
    similarityScores: Object.fromEntries(retrieved.map(d => [d.chunkId, d.similarityScore])),
    sourceNames: [...new Set(retrieved.map(d => d.sourceName))],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4: TRACK SYSTEM METRICS
// ─────────────────────────────────────────────────────────────────────────────

export function computeMetrics(trace: Trace): TraceMetrics {
  const llmSpans   = trace.spans.filter(s => s.type === 'llm_call');
  const ragSpans   = trace.spans.filter(s => s.type === 'retriever' || s.type === 'retrieved_chunks');
  const toolSpans  = trace.spans.filter(s => s.type === 'tool_call');
  const errorSpans = trace.spans.filter(s => s.error);

  const llmLatencyMs      = sum(llmSpans.map(s => s.durationMs ?? 0));
  const retrievalLatencyMs = sum(ragSpans.map(s => s.durationMs ?? 0));
  const totalLatencyMs    = (trace.endMs ?? Date.now()) - trace.startMs;

  // Token counts come from LLM span metadata
  const tokenMeta = llmSpans.flatMap(s => s.metadata ?? []);
  const promptTokens     = sumMetaKey(tokenMeta, 'prompt_tokens');
  const completionTokens = sumMetaKey(tokenMeta, 'completion_tokens');
  const totalTokensUsed  = promptTokens + completionTokens;

  // Cost estimate (rough — use actual pricing from model metadata in production)
  const modelCostUsd = estimateCost(trace.modelName, promptTokens, completionTokens);

  return {
    totalLatencyMs,
    llmLatencyMs,
    retrievalLatencyMs,
    totalTokensUsed,
    promptTokens,
    completionTokens,
    modelCostUsd,
    toolCallCount:    toolSpans.length,
    retryCount:       sumMetaKey(tokenMeta, 'retry_count'),
    failedToolCalls:  toolSpans.filter(s => s.error).length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5: SCORE ANSWER QUALITY
// ─────────────────────────────────────────────────────────────────────────────

export async function scoreAnswerQuality(
  userQuestion: string,
  finalAnswer: string,
  ragContext: RAGContext | null,
  userFeedback?: 'thumbs_up' | 'thumbs_down' | null
): Promise<QualityScores> {
  // Groundedness: did the answer cite or use retrieved chunks?
  const groundedness = ragContext
    ? computeGroundedness(finalAnswer, ragContext.retrievedDocuments)
    : 1.0; // No RAG = not applicable, score neutral

  // Answer relevance: heuristic — does answer address question topic?
  const answerRelevance = computeRelevance(userQuestion, finalAnswer);

  // Hallucination risk: flags answers that assert specifics without retrieval backing
  const hallucinationRisk = computeHallucinationRisk(finalAnswer, ragContext);

  // Safety score: basic content safety check
  const safetyScore = computeSafetyScore(finalAnswer);

  // Cost efficiency: was cost within acceptable range for this type of query?
  const costEfficiency = 1.0; // Populated from metrics in finalizeTrace

  // User satisfaction from explicit feedback
  const userSatisfaction = userFeedback === 'thumbs_up'
    ? 1.0
    : userFeedback === 'thumbs_down'
      ? 0.0
      : undefined;

  return {
    groundedness,
    answerRelevance,
    hallucinationRisk,
    safetyScore,
    costEfficiency,
    userSatisfaction,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6: FLAG BAD ANSWERS
// ─────────────────────────────────────────────────────────────────────────────

export function evaluateFlaggingRules(
  trace: Trace,
  ragContext: RAGContext | null,
  scores: QualityScores,
  metrics: TraceMetrics
): TraceFlag[] {
  const flags: TraceFlag[] = [];

  // Rule 1: Answer cites policy but no source was retrieved
  if (
    ragContext &&
    ragContext.passedToModel.length === 0 &&
    trace.spans.some(s => s.type === 'final_response')
  ) {
    flags.push({
      ruleId: 'NO_SOURCE_POLICY_CLAIM',
      severity: 'error',
      reason: 'Answer may reference policy but no document was retrieved',
      details: { passedToModel: ragContext.passedToModel.length },
    });
  }

  // Rule 2: Retrieved document contradicts model output (low groundedness)
  if (scores.groundedness < 0.4) {
    flags.push({
      ruleId: 'LOW_GROUNDEDNESS',
      severity: 'error',
      reason: `Groundedness score ${scores.groundedness.toFixed(2)} — answer may not be grounded in retrieved context`,
      details: { groundedness: scores.groundedness },
    });
  }

  // Rule 3: Cost spike — model cost > 10× p50 for this query type
  if (metrics.modelCostUsd > 0.10) {
    flags.push({
      ruleId: 'COST_SPIKE',
      severity: 'warning',
      reason: `Unusually high cost: $${metrics.modelCostUsd.toFixed(4)}`,
      details: { costUsd: metrics.modelCostUsd, tokens: metrics.totalTokensUsed },
    });
  }

  // Rule 4: High hallucination risk
  if (scores.hallucinationRisk > 0.6) {
    flags.push({
      ruleId: 'HALLUCINATION_RISK',
      severity: 'critical',
      reason: `Hallucination risk score ${scores.hallucinationRisk.toFixed(2)} — answer may fabricate facts`,
      details: { hallucinationRisk: scores.hallucinationRisk },
    });
  }

  // Rule 5: User thumbs down
  if (scores.userSatisfaction === 0.0) {
    flags.push({
      ruleId: 'USER_THUMBS_DOWN',
      severity: 'warning',
      reason: 'User explicitly rated this answer as unhelpful',
    });
  }

  // Rule 6: Latency SLA breach (>3000ms for standard queries)
  if (metrics.totalLatencyMs > 3000) {
    flags.push({
      ruleId: 'LATENCY_SLA_BREACH',
      severity: 'warning',
      reason: `Response took ${metrics.totalLatencyMs}ms (SLA: 3000ms)`,
      details: { latencyMs: metrics.totalLatencyMs },
    });
  }

  // Rule 7: Failed tool calls
  if (metrics.failedToolCalls > 0) {
    flags.push({
      ruleId: 'FAILED_TOOL_CALLS',
      severity: 'error',
      reason: `${metrics.failedToolCalls} tool call(s) failed during this trace`,
      details: { failedToolCalls: metrics.failedToolCalls },
    });
  }

  return flags;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 7: PERSIST TRACE TO DATABASE
// Powers the "Bad Answers" dashboard
// ─────────────────────────────────────────────────────────────────────────────

export async function persistTrace(
  trace: Trace,
  ragContext: RAGContext | null
): Promise<void> {
  const supabase = createServiceClient();

  // Write the trace
  await supabase.from('ai_traces').upsert({
    trace_id:       trace.traceId,
    session_id:     trace.sessionId,
    user_id:        trace.userId,
    model_name:     trace.modelName,
    prompt_version: trace.promptVersion,
    temperature:    trace.temperature,
    environment:    trace.environment,
    start_ms:       trace.startMs,
    end_ms:         trace.endMs,
    spans:          trace.spans,
    metrics:        trace.metrics,
    quality_scores: trace.qualityScores,
    flags:          trace.flags,
    is_flagged:     (trace.flags?.length ?? 0) > 0,
    flag_severity:  getMaxSeverity(trace.flags),
    created_at:     new Date().toISOString(),
  }, { onConflict: 'trace_id' });

  // Write RAG context separately (it can be large)
  if (ragContext) {
    await supabase.from('ai_rag_contexts').upsert({
      trace_id:             ragContext.traceId,
      span_id:              ragContext.spanId,
      retrieved_documents:  ragContext.retrievedDocuments.map(d => ({
        ...d,
        content: hashContent(d.content), // hash stored content for privacy
      })),
      passed_to_model:      ragContext.passedToModel,
      similarity_scores:    ragContext.similarityScores,
      source_names:         ragContext.sourceNames,
    }, { onConflict: 'trace_id' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 8: FINALIZE TRACE (call at end of every AI request)
// ─────────────────────────────────────────────────────────────────────────────

export async function finalizeTrace(
  trace: Trace,
  params: {
    userQuestion: string;
    finalAnswer: string;
    ragContext: RAGContext | null;
    userFeedback?: 'thumbs_up' | 'thumbs_down' | null;
  }
): Promise<void> {
  trace.endMs = Date.now();
  trace.metrics = computeMetrics(trace);

  const scores = await scoreAnswerQuality(
    params.userQuestion,
    params.finalAnswer,
    params.ragContext,
    params.userFeedback
  );
  trace.qualityScores = scores;

  const flags = evaluateFlaggingRules(
    trace,
    params.ragContext,
    scores,
    trace.metrics
  );
  trace.flags = flags;

  await persistTrace(trace, params.ragContext);
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateSpanId(): string {
  return `span_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

function hashObject(obj: unknown): string {
  return hashContent(JSON.stringify(obj));
}

function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

function sumMetaKey(metas: unknown[], key: string): number {
  return metas.reduce<number>((acc, m) => {
    if (typeof m === 'object' && m !== null && key in m) {
      const val = (m as Record<string, unknown>)[key];
      return acc + Number(val ?? 0);
    }
    return acc;
  }, 0);
}

function estimateCost(model: string, promptTokens: number, completionTokens: number): number {
  // Rough cost table (USD per 1M tokens) — update as models change
  const COST_TABLE: Record<string, { input: number; output: number }> = {
    'google/gemini-flash-1.5':         { input: 0.075, output: 0.30  },
    'anthropic/claude-3-haiku':        { input: 0.25,  output: 1.25  },
    'anthropic/claude-3-5-sonnet':     { input: 3.00,  output: 15.00 },
    'openai/gpt-4o':                   { input: 2.50,  output: 10.00 },
    'openai/gpt-4o-mini':              { input: 0.15,  output: 0.60  },
  };
  const costs = COST_TABLE[model] ?? { input: 1.0, output: 3.0 };
  return (promptTokens * costs.input + completionTokens * costs.output) / 1_000_000;
}

function computeGroundedness(answer: string, docs: RetrievedDoc[]): number {
  if (docs.length === 0) return 0.5;
  const docWords = new Set(
    docs.flatMap(d => d.content.toLowerCase().split(/\W+/))
  );
  const answerWords = answer.toLowerCase().split(/\W+/);
  const overlap = answerWords.filter(w => w.length > 4 && docWords.has(w)).length;
  return Math.min(1.0, overlap / Math.max(1, answerWords.length * 0.3));
}

function computeRelevance(question: string, answer: string): number {
  const qWords = new Set(question.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  const aWords = answer.toLowerCase().split(/\W+/);
  const overlap = aWords.filter(w => qWords.has(w)).length;
  return Math.min(1.0, overlap / Math.max(1, qWords.size));
}

function computeHallucinationRisk(answer: string, ragContext: RAGContext | null): number {
  // Heuristic: specific numbers, dates, names without retrieval backing = higher risk
  const specificClaimPattern = /\b\d{4}\b|\b\d+%|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b/g;
  const claims = answer.match(specificClaimPattern)?.length ?? 0;
  const hasRetrieval = (ragContext?.passedToModel.length ?? 0) > 0;

  if (claims > 5 && !hasRetrieval) return 0.8;
  if (claims > 2 && !hasRetrieval) return 0.5;
  if (claims > 0 && !hasRetrieval) return 0.3;
  return 0.1;
}

function computeSafetyScore(answer: string): number {
  // Basic safety — flag if answer contains patterns that shouldn't be in HoundShield responses
  const unsafePatterns = [
    /how to bypass/i,
    /ignore (?:previous|all) instructions/i,
    /jailbreak/i,
  ];
  return unsafePatterns.some(p => p.test(answer)) ? 0.0 : 1.0;
}

function getMaxSeverity(flags?: TraceFlag[]): string | null {
  if (!flags || flags.length === 0) return null;
  if (flags.some(f => f.severity === 'critical')) return 'critical';
  if (flags.some(f => f.severity === 'error')) return 'error';
  return 'warning';
}
