/**
 * Tests for lib/brain-ai/status-intent — status question detection and the
 * consent gate that governs whether Brain AI answers from customer data.
 */

import { describe, it, expect } from 'vitest';
import {
  isStatusQuestion,
  statusAnswerFromConsent,
  CONSENT_REQUIRED_MESSAGE,
  sprsInputSchema,
} from '@/lib/brain-ai/status-intent';
import { buildCustomerStatus } from '@/lib/customer/status';

describe('isStatusQuestion', () => {
  it('matches personalized status questions', () => {
    for (const q of [
      'where do I stand?',
      "what's my next step",
      'am I CMMC ready?',
      'how am I doing',
      'what do I need to fix',
      'where did I go wrong',
      'what is my SPRS score',
      'how many gaps do I have left',
      'what should I do next',
    ]) {
      expect(isStatusQuestion(q)).toBe(true);
    }
  });

  it('does NOT hijack general product questions', () => {
    for (const q of [
      'what is SPRS',
      'how does CMMC Level 2 work',
      'what is HoundShield',
      'explain NIST 800-171',
      'how much does it cost',
    ]) {
      expect(isStatusQuestion(q)).toBe(false);
    }
  });

  it('rejects trivially short input', () => {
    expect(isStatusQuestion('')).toBe(false);
    expect(isStatusQuestion('hi')).toBe(false);
  });
});

describe('statusAnswerFromConsent', () => {
  const status = buildCustomerStatus({
    sprs: {
      score: 70,
      completionPercent: 100,
      totalControls: 110,
      metCount: 107,
      partialCount: 0,
      unmetCount: 3,
      assessedCount: 110,
      topGaps: [
        { controlId: 'AC.1.001', title: 'Limit access', status: 'UNMET', deduction: -5, fix: 'Do the thing', hours: 4 },
      ],
    },
    account: { tier: 'pro', latestOrder: null },
  });

  it('asks permission when consent is not granted', () => {
    expect(statusAnswerFromConsent({ consent: false, status })).toBe(CONSENT_REQUIRED_MESSAGE);
  });

  it('asks permission when consent granted but no status available', () => {
    expect(statusAnswerFromConsent({ consent: true, status: null })).toBe(CONSENT_REQUIRED_MESSAGE);
  });

  it('returns the deterministic status answer when consent + status present', () => {
    const answer = statusAnswerFromConsent({ consent: true, status });
    expect(answer).toContain('SPRS score: 70');
    expect(answer).toContain('AC.1.001');
    expect(answer).not.toBe(CONSENT_REQUIRED_MESSAGE);
  });

  it('the consent-required message asks for permission and never leaks another party', () => {
    expect(CONSENT_REQUIRED_MESSAGE).toMatch(/permission/i);
    expect(CONSENT_REQUIRED_MESSAGE).toMatch(/never anyone else/i);
  });
});

describe('sprsInputSchema', () => {
  it('accepts a well-formed SPRS slice', () => {
    const sprs = {
      score: 70,
      completionPercent: 100,
      totalControls: 110,
      metCount: 107,
      partialCount: 0,
      unmetCount: 3,
      assessedCount: 110,
      topGaps: [
        { controlId: 'AC.1.001', title: 'x', status: 'UNMET', deduction: -5, fix: 'do', hours: 4 },
      ],
    };
    expect(sprsInputSchema.safeParse(sprs).success).toBe(true);
  });

  it('rejects a malformed slice', () => {
    expect(sprsInputSchema.safeParse({ score: 'high' }).success).toBe(false);
    expect(sprsInputSchema.safeParse(null).success).toBe(false);
  });
});
