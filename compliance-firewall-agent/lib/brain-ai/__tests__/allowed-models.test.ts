/**
 * GUARD: a request field must never select what we are billed for.
 *
 * `POST /api/brain-ai/execute` read `model` straight off the request body and
 * passed it to the query engine. The route was unauthenticated and unmetered,
 * so the cheapest attack was not a flood but one slow loop pinned to the most
 * expensive model on the platform. These cases pin the two properties that make
 * that impossible: expensive models are not selectable, and anything
 * unrecognised falls back rather than passing through.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { BRAIN_AI_PRICING } from '../cost-tracker';
import {
  resolveBrainAiModel,
  isAllowedBrainAiModel,
  allowedBrainAiModels,
  MAX_SELECTABLE_OUTPUT_PRICE_PER_1K,
} from '../allowed-models';

const ORIGINAL = process.env.BRAIN_AI_MODEL;
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.BRAIN_AI_MODEL;
  else process.env.BRAIN_AI_MODEL = ORIGINAL;
});

describe('the allow-list is derived from the real pricing table', () => {
  it('admits nothing priced above the ceiling', () => {
    for (const id of allowedBrainAiModels()) {
      const price = BRAIN_AI_PRICING[id];
      // The configured default is admitted by policy even if unpriced/expensive.
      if (!price || id === (process.env.BRAIN_AI_MODEL || 'google/gemini-flash-1.5')) continue;
      expect(price.outputPer1k).toBeLessThanOrEqual(MAX_SELECTABLE_OUTPUT_PRICE_PER_1K);
    }
  });

  it('admits the free tier', () => {
    expect(isAllowedBrainAiModel('google/gemini-flash-1.5')).toBe(true);
    expect(isAllowedBrainAiModel('deepseek/deepseek-chat')).toBe(true);
  });

  it('is not empty — a ceiling that admits nothing would break every turn', () => {
    expect(allowedBrainAiModels().length).toBeGreaterThan(0);
  });
});

describe('expensive models are not selectable by a caller', () => {
  // The exact strings this guard exists to refuse. Named individually so a
  // future pricing edit that quietly re-admits one fails loudly here.
  const REFUSED = [
    'anthropic/claude-sonnet-4-6',
    'openai/gpt-4o',
    'google/gemini-pro-1.5',
  ];

  for (const id of REFUSED) {
    it(`refuses ${id}`, () => {
      expect(isAllowedBrainAiModel(id)).toBe(false);
      expect(resolveBrainAiModel(id)).toBeUndefined();
    });
  }

  it('the refused models are genuinely in the pricing table (so this is a real refusal)', () => {
    // Guards against the test passing because a name was simply misspelled.
    for (const id of REFUSED) {
      expect(BRAIN_AI_PRICING[id]).toBeDefined();
    }
  });
});

describe('resolveBrainAiModel falls back rather than passing through', () => {
  it('returns undefined for an absent model', () => {
    expect(resolveBrainAiModel(undefined)).toBeUndefined();
  });

  it('returns undefined for an unknown string', () => {
    expect(resolveBrainAiModel('some/model-that-does-not-exist')).toBeUndefined();
  });

  it('returns undefined for non-string input', () => {
    // A JSON body can carry any type; none of them may become a model id.
    expect(resolveBrainAiModel(42)).toBeUndefined();
    expect(resolveBrainAiModel(null)).toBeUndefined();
    expect(resolveBrainAiModel({ toString: () => 'openai/gpt-4o' })).toBeUndefined();
    expect(resolveBrainAiModel(['google/gemini-flash-1.5'])).toBeUndefined();
  });

  it('returns the exact string for an allowed model', () => {
    expect(resolveBrainAiModel('google/gemini-flash-1.5')).toBe('google/gemini-flash-1.5');
  });
});

describe('the operator default is always permitted', () => {
  it('admits BRAIN_AI_MODEL even when it is priced above the ceiling', () => {
    // An operator setting an expensive default is a deliberate spend decision;
    // a caller naming the same model is not.
    process.env.BRAIN_AI_MODEL = 'anthropic/claude-sonnet-4-6';
    expect(allowedBrainAiModels()).toContain('anthropic/claude-sonnet-4-6');
  });

  it('re-reads the environment per call rather than freezing at import', () => {
    // Fluid Compute reuses instances; a module-level constant would pin the
    // first value the process ever saw.
    process.env.BRAIN_AI_MODEL = 'openai/gpt-4o';
    expect(allowedBrainAiModels()).toContain('openai/gpt-4o');
    process.env.BRAIN_AI_MODEL = 'google/gemini-flash-1.5';
    expect(allowedBrainAiModels()).not.toContain('openai/gpt-4o');
  });
});
