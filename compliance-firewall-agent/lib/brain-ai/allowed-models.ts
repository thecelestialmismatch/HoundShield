import { BRAIN_AI_PRICING } from './cost-tracker';

/**
 * Server-side allow-list for the caller-supplied `model` field.
 *
 * THE HOLE THIS CLOSES. `POST /api/brain-ai/execute` read `model` straight off
 * the request body and handed it to `QueryEngine.updateConfig()`. The route was
 * unauthenticated and unmetered, so the cheapest attack was never a flood — it
 * was one slow loop pinned to the most expensive model OpenRouter offers. A
 * request field must never select what we are billed for.
 *
 * WHY A PRICE CEILING AND NOT A HAND-WRITTEN LIST. `BRAIN_AI_PRICING` in
 * ./cost-tracker.ts is already the repository's single record of which models
 * exist and what they cost. Copying its keys here would re-admit
 * `openai/gpt-4o` and `anthropic/claude-sonnet-4-6` — precisely the entries this
 * guard exists to keep a stranger off — and a second hand-maintained list is a
 * list that drifts. Filtering the existing table on output price means the rule
 * is stated once, in money: a caller may pick anything at or under the ceiling,
 * and nothing above it, whatever gets added to the table later.
 *
 * The configured default is always permitted even if it is priced above the
 * ceiling, because that is an operator decision (BRAIN_AI_MODEL, set in the
 * environment) rather than a caller's.
 *
 * ponytail: cost-based filter over the existing table, not a parallel list.
 */

/**
 * USD per 1,000 output tokens a caller may select up to.
 *
 * 0.0006 admits the free tier plus `openai/gpt-4o-mini`; it excludes
 * `gpt-4o` (0.015, 25×) and `claude-sonnet-4-6` (0.015). Output tokens are the
 * dominant cost in a turn loop, which is why the ceiling is set on them.
 */
export const MAX_SELECTABLE_OUTPUT_PRICE_PER_1K = 0.0006;

/** Mirrors lib/brain-ai/context.ts:53 — the default when nothing is configured. */
const FALLBACK_DEFAULT_MODEL = 'google/gemini-flash-1.5';

/** The operator's default. Read at call time so tests and deploys can vary it. */
function defaultModel(): string {
  return process.env.BRAIN_AI_MODEL || FALLBACK_DEFAULT_MODEL;
}

/**
 * Every model a request is allowed to name, cheapest-first ordering not implied.
 *
 * Computed per call rather than frozen at module load so that a change to
 * `BRAIN_AI_MODEL` between requests is honoured — module-level constants in a
 * reused Fluid Compute instance would pin the first value seen.
 */
export function allowedBrainAiModels(): string[] {
  const affordable = Object.entries(BRAIN_AI_PRICING)
    .filter(([, price]) => price.outputPer1k <= MAX_SELECTABLE_OUTPUT_PRICE_PER_1K)
    .map(([id]) => id);

  const withDefault = new Set(affordable);
  withDefault.add(defaultModel());
  return [...withDefault];
}

/** True when `model` is a string a caller is permitted to select. */
export function isAllowedBrainAiModel(model: unknown): model is string {
  return typeof model === 'string' && allowedBrainAiModels().includes(model);
}

/**
 * Resolve a caller-supplied model to one the server is willing to bill for.
 *
 * Returns `undefined` for anything absent, malformed, or off the list. The
 * caller (the route) treats `undefined` as "do not override" and lets the
 * engine keep its configured default — so an unknown string quietly downgrades
 * to the cheap path instead of erroring. That is deliberate: a 400 here would
 * tell a prober exactly which model names are live.
 */
export function resolveBrainAiModel(model?: unknown): string | undefined {
  return isAllowedBrainAiModel(model) ? model : undefined;
}
