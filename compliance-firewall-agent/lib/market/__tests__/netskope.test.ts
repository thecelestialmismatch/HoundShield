import { describe, expect, it } from 'vitest';
import {
  ALL_MARKET_STATS,
  CROSS_INDUSTRY_GENAI,
  LOCAL_GENAI_INFRA,
  PERSONAL_ACCOUNT_SENSITIVE,
  PERSONAL_GENAI_ACCOUNTS,
  REGULATED_SHARE_ALL,
  REGULATED_SHARE_GENAI,
  stat,
  statPlain,
} from '../netskope';

/**
 * These tests exist because the site shipped a statistic that misstated its own
 * source, in the cold outreach email, to compliance buyers who verify by
 * profession. Each assertion below pins a figure to the denominator that makes
 * it true. If a number changes, the scope must change with it.
 */
describe('Netskope market statistics', () => {
  describe('every stat carries its own provenance', () => {
    it.each(ALL_MARKET_STATS.map((s) => [s.value, s] as const))(
      '%s has a scope, source, url and date',
      (_value, s) => {
        expect(s.scope.length).toBeGreaterThan(20);
        expect(s.source).toBe('Netskope Threat Labs Report: Healthcare 2025');
        expect(s.url).toMatch(/^https:\/\/www\.netskope\.com\//);
        expect(s.published).toMatch(/^\d{4}-\d{2}$/);
      },
    );

    it('no scope is a bare restatement of the number', () => {
      for (const s of ALL_MARKET_STATS) {
        expect(s.scope).not.toContain(s.value);
      }
    });
  });

  describe('the 89 / 81 pair — different denominators, both correct', () => {
    it('89% is scoped to generative AI specifically', () => {
      expect(REGULATED_SHARE_GENAI.value).toBe('89%');
      expect(REGULATED_SHARE_GENAI.scope).toContain('generative AI');
      expect(REGULATED_SHARE_GENAI.scope).toContain('regulated data');
    });

    it('81% is scoped to ALL violations, not just genAI', () => {
      expect(REGULATED_SHARE_ALL.value).toBe('81%');
      expect(REGULATED_SHARE_ALL.scope).toContain('all healthcare data policy violations');
      expect(REGULATED_SHARE_ALL.scope).not.toContain('generative AI');
    });

    it('the two are never interchangeable — scopes are distinct', () => {
      expect(REGULATED_SHARE_GENAI.scope).not.toBe(REGULATED_SHARE_ALL.scope);
    });

    it('31% is the cross-industry comparison for the genAI measure', () => {
      expect(CROSS_INDUSTRY_GENAI.value).toBe('31%');
      expect(CROSS_INDUSTRY_GENAI.scope).toContain('all industries');
      expect(CROSS_INDUSTRY_GENAI.scope).toContain('generative AI');
    });
  });

  describe('the 43% regression — it does not mean personal accounts', () => {
    it('43% is scoped to local genAI infrastructure, never to personal accounts', () => {
      expect(LOCAL_GENAI_INFRA.value).toBe('43%');
      expect(LOCAL_GENAI_INFRA.scope).toContain('infrastructure locally');
      expect(LOCAL_GENAI_INFRA.scope).not.toContain('personal');
    });

    it('the personal-account figure is 71%, not 43%', () => {
      expect(PERSONAL_GENAI_ACCOUNTS.value).toBe('71%');
      expect(PERSONAL_GENAI_ACCOUNTS.value).not.toBe('43%');
      expect(PERSONAL_GENAI_ACCOUNTS.scope).toContain('personal genAI accounts');
    });

    it('the sensitive-data-via-personal-account figure is more than two-thirds', () => {
      expect(PERSONAL_ACCOUNT_SENSITIVE.value).toBe('more than two-thirds');
      expect(PERSONAL_ACCOUNT_SENSITIVE.scope).toContain('sensitive data');
      expect(PERSONAL_ACCOUNT_SENSITIVE.scope).toContain('personal AI account');
    });

    it('no stat pairs 43% with personal accounts', () => {
      const offending = ALL_MARKET_STATS.filter(
        (s) => s.value === '43%' && /personal/i.test(s.scope),
      );
      expect(offending).toEqual([]);
    });
  });

  describe('rendering always carries the denominator', () => {
    it('stat() includes value, scope, source and date', () => {
      const rendered = stat(REGULATED_SHARE_GENAI);
      expect(rendered).toContain('89%');
      expect(rendered).toContain('generative AI');
      expect(rendered).toContain('Netskope');
      expect(rendered).toContain('2025-05');
    });

    it('statPlain() drops the source but keeps the scope', () => {
      const rendered = statPlain(PERSONAL_GENAI_ACCOUNTS);
      expect(rendered).toContain('71%');
      expect(rendered).toContain('personal genAI accounts');
      expect(rendered).not.toContain('Netskope');
    });

    it('a rendered stat is never just a number', () => {
      for (const s of ALL_MARKET_STATS) {
        expect(statPlain(s).length).toBeGreaterThan(s.value.length + 20);
      }
    });
  });
});
