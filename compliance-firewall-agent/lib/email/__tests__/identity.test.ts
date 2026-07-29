import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  FOUNDER_TITLE,
  founderName,
  founderAddress,
  GENERAL_INBOX,
  NOREPLY_ADDRESS,
  TRANSACTIONAL_FROM,
  isEmailShaped,
  isPlaceholderAddress,
  isSendableAddress,
  founderInbox,
  founderInboxDiagnostic,
  hasBrokenFounderEmailOverride,
  founderFrom,
  transactionalFrom,
  founderSignature,
} from '../identity';

const ORIGINAL_EMAIL = process.env.FOUNDER_EMAIL;
const ORIGINAL_NAME = process.env.FOUNDER_NAME;

function restore(key: 'FOUNDER_EMAIL' | 'FOUNDER_NAME', value: string | undefined) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

afterEach(() => {
  restore('FOUNDER_EMAIL', ORIGINAL_EMAIL);
  restore('FOUNDER_NAME', ORIGINAL_NAME);
});

beforeEach(() => {
  delete process.env.FOUNDER_EMAIL;
  delete process.env.FOUNDER_NAME;
});

describe('personal identity is never committed to this public repo', () => {
    it('exposes no personal name or mailbox as a module constant', () => {
    // The regression this locks: a hardcoded founder address in a PUBLIC repo is
    // published to every clone and every search index. Identity comes from env.
    const src = readFileSync(join(process.cwd(), 'lib', 'email', 'identity.ts'), 'utf8');
    expect(src).not.toMatch(/export const FOUNDER_(NAME|ADDRESS)\b/);
    // A role title is not personal data — that one may stay.
    expect(FOUNDER_TITLE).toBe('Founder, HoundShield');
  });

  it('falls back to impersonal values when nothing is configured', () => {
    expect(founderName()).toBe('HoundShield');
    expect(founderAddress()).toBe(GENERAL_INBOX);
  });

  it('uses the configured identity when env is set', () => {
    process.env.FOUNDER_NAME = 'Dana';
    process.env.FOUNDER_EMAIL = 'dana@houndshield.com';
    expect(founderName()).toBe('Dana');
    expect(founderAddress()).toBe('dana@houndshield.com');
  });

  it('keeps the publishable inbox generic', () => {
    expect(GENERAL_INBOX).toBe('contact@houndshield.com');
  });

  it('sends automated mail from a send-only address', () => {
    expect(NOREPLY_ADDRESS).toBe('noreply@houndshield.com');
    expect(TRANSACTIONAL_FROM).toBe('HoundShield <noreply@houndshield.com>');
  });

  it('every address is on the houndshield.com domain', () => {
    for (const addr of [founderAddress(), GENERAL_INBOX, NOREPLY_ADDRESS]) {
      expect(addr.toLowerCase().endsWith('@houndshield.com')).toBe(true);
    }
  });
});

describe('isEmailShaped', () => {
  it.each([
    'a@b.co',
    'founder@houndshield.com',
    'first.last+tag@sub.domain.org',
  ])('accepts %s', (v) => {
    expect(isEmailShaped(v)).toBe(true);
  });

  it.each([
    ['', 'empty'],
    ['no-at-sign.com', 'no @'],
    ['two@@at.com', 'double @'],
    ['no@tld', 'no dot in domain'],
    ['spaces in@email.com', 'whitespace'],
    ['Dana <d@houndshield.com>', 'angle brackets — a From header, not an address'],
    ['a@b.co,c@d.co', 'comma-separated list'],
  ])('rejects %s (%s)', (v) => {
    expect(isEmailShaped(v)).toBe(false);
  });

  it('rejects null and undefined', () => {
    expect(isEmailShaped(null)).toBe(false);
    expect(isEmailShaped(undefined)).toBe(false);
  });
});

describe('isPlaceholderAddress — the "no flukes" guard', () => {
  it.each([
    'someone@example.com',
    'test@example.org',
    'a@domain.tld',
    'x@yourcompany.com',
    'dana@clinic.com',
    'nobody@something.test',
    'nobody@thing.invalid',
    'firstname@realclinic.org',
    'first.last@realclinic.org',
    '[First name]@clinic.org',
    '{{email}}@clinic.org',
  ])('flags %s as a placeholder', (v) => {
    expect(isPlaceholderAddress(v)).toBe(true);
  });

  it.each([
    'dana@ridgeviewfamilymed.org',
    'founder@houndshield.com',
    'j.smith@summit7.us',
  ])('does NOT flag the real-looking address %s', (v) => {
    expect(isPlaceholderAddress(v)).toBe(false);
  });

  it('treats a missing address as a placeholder, never as sendable', () => {
    expect(isPlaceholderAddress(null)).toBe(true);
    expect(isPlaceholderAddress('')).toBe(true);
  });
});

describe('isSendableAddress', () => {
  it('requires BOTH valid shape and non-placeholder', () => {
    expect(isSendableAddress('dana@ridgeviewfamilymed.org')).toBe(true);
    expect(isSendableAddress('dana@example.com')).toBe(false); // shaped but reserved
    expect(isSendableAddress('not-an-email')).toBe(false); // malformed
  });
});

describe('founderInbox', () => {
  it('defaults to the published generic inbox when unconfigured', () => {
    // Never a personal address: this default is committed to a public repo.
    expect(founderInbox()).toBe(GENERAL_INBOX);
  });

  it('honours a valid FOUNDER_EMAIL override', () => {
    process.env.FOUNDER_EMAIL = 'alerts@houndshield.com';
    expect(founderInbox()).toBe('alerts@houndshield.com');
  });

  it('trims whitespace from the override', () => {
    process.env.FOUNDER_EMAIL = '  alerts@houndshield.com  ';
    expect(founderInbox()).toBe('alerts@houndshield.com');
  });

  it('IGNORES a malformed override rather than obeying it', () => {
    // The failure this prevents: a typo'd env var silently routing every $499
    // sale alert to an address that cannot receive.
    process.env.FOUNDER_EMAIL = 'founder-at-houndshield.com';
    expect(founderInbox()).toBe(GENERAL_INBOX);
  });

  it('never returns an empty recipient', () => {
    process.env.FOUNDER_EMAIL = '';
    expect(founderInbox()).toBeTruthy();
    expect(founderInbox()).toBe(GENERAL_INBOX);
  });
});

describe('hasBrokenFounderEmailOverride', () => {
  it('is false when unset (the default is intentional, not broken)', () => {
    expect(hasBrokenFounderEmailOverride()).toBe(false);
  });

  it('is false for a usable override', () => {
    process.env.FOUNDER_EMAIL = 'alerts@houndshield.com';
    expect(hasBrokenFounderEmailOverride()).toBe(false);
  });

  it('is TRUE for a set-but-unusable override, so the typo is visible', () => {
    process.env.FOUNDER_EMAIL = 'oops';
    expect(hasBrokenFounderEmailOverride()).toBe(true);
  });
});

describe('founderInboxDiagnostic', () => {
  it('reports the default source and domain when unset', () => {
    expect(founderInboxDiagnostic()).toEqual({
      source: 'default',
      domain: 'houndshield.com',
      broken: false,
    });
  });

  it('reports an override when one is usable', () => {
    process.env.FOUNDER_EMAIL = 'alerts@example-real.io';
    expect(founderInboxDiagnostic()).toEqual({
      source: 'override',
      domain: 'example-real.io',
      broken: false,
    });
  });

  it('reports default + broken when the override is malformed', () => {
    process.env.FOUNDER_EMAIL = 'oops';
    const d = founderInboxDiagnostic();
    expect(d.source).toBe('default');
    expect(d.broken).toBe(true);
    expect(d.domain).toBe('houndshield.com');
  });

  it('never leaks a full mailbox — only the domain', () => {
    process.env.FOUNDER_EMAIL = 'secret.person@private-host.com';
    const serialized = JSON.stringify(founderInboxDiagnostic());
    expect(serialized).not.toContain('secret.person');
    expect(serialized).not.toContain('@');
  });
});

describe('header builders', () => {
  it('builds a human From header from the configured identity', () => {
    process.env.FOUNDER_NAME = 'Dana';
    process.env.FOUNDER_EMAIL = 'dana@houndshield.com';
    expect(founderFrom()).toBe('Dana <dana@houndshield.com>');
  });

  it('degrades to an impersonal From header rather than leaking a default', () => {
    expect(founderFrom()).toBe('HoundShield <contact@houndshield.com>');
  });

  it('builds transactional From headers, with and without a label', () => {
    expect(transactionalFrom()).toBe('HoundShield <noreply@houndshield.com>');
    expect(transactionalFrom('Partners')).toBe('HoundShield Partners <noreply@houndshield.com>');
    expect(transactionalFrom('Contact')).toBe('HoundShield Contact <noreply@houndshield.com>');
  });

  it('ignores a blank label rather than emitting a trailing space', () => {
    expect(transactionalFrom('   ')).toBe('HoundShield <noreply@houndshield.com>');
  });

  it('signs with the configured name and the role title', () => {
    process.env.FOUNDER_NAME = 'Dana';
    expect(founderSignature()).toBe('Dana\nFounder, HoundShield');
    expect(founderSignature()).not.toMatch(/no-?reply/i);
  });
});
