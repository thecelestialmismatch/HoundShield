import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  FOUNDER_NAME,
  FOUNDER_TITLE,
  FOUNDER_ADDRESS,
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

const ORIGINAL = process.env.FOUNDER_EMAIL;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.FOUNDER_EMAIL;
  else process.env.FOUNDER_EMAIL = ORIGINAL;
});

beforeEach(() => {
  delete process.env.FOUNDER_EMAIL;
});

describe('founder identity constants', () => {
  it('names the founder and their real mailbox', () => {
    expect(FOUNDER_NAME).toBe('Gaurav');
    expect(FOUNDER_TITLE).toBe('Founder, HoundShield');
    expect(FOUNDER_ADDRESS).toBe('Gaurav@houndshield.com');
  });

  it('keeps the publishable inbox distinct from the founder address', () => {
    // These must never converge: one is printed to visitors, the other is where
    // revenue alerts land.
    expect(GENERAL_INBOX).toBe('contact@houndshield.com');
    expect(GENERAL_INBOX).not.toBe(FOUNDER_ADDRESS);
  });

  it('sends automated mail from a send-only address', () => {
    expect(NOREPLY_ADDRESS).toBe('noreply@houndshield.com');
    expect(TRANSACTIONAL_FROM).toBe('HoundShield <noreply@houndshield.com>');
  });

  it('every address is on the houndshield.com domain', () => {
    for (const addr of [FOUNDER_ADDRESS, GENERAL_INBOX, NOREPLY_ADDRESS]) {
      expect(addr.toLowerCase().endsWith('@houndshield.com')).toBe(true);
    }
  });
});

describe('isEmailShaped', () => {
  it.each([
    'a@b.co',
    'Gaurav@houndshield.com',
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
    ['Gaurav <g@houndshield.com>', 'angle brackets — a From header, not an address'],
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
    'Gaurav@houndshield.com',
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
  it('defaults to the founder mailbox, not a generic inbox', () => {
    expect(founderInbox()).toBe(FOUNDER_ADDRESS);
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
    process.env.FOUNDER_EMAIL = 'gaurav-at-houndshield.com';
    expect(founderInbox()).toBe(FOUNDER_ADDRESS);
  });

  it('never returns an empty recipient', () => {
    process.env.FOUNDER_EMAIL = '';
    expect(founderInbox()).toBeTruthy();
    expect(founderInbox()).toBe(FOUNDER_ADDRESS);
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
  it('builds a human From header for outreach', () => {
    expect(founderFrom()).toBe('Gaurav <Gaurav@houndshield.com>');
  });

  it('builds transactional From headers, with and without a label', () => {
    expect(transactionalFrom()).toBe('HoundShield <noreply@houndshield.com>');
    expect(transactionalFrom('Partners')).toBe('HoundShield Partners <noreply@houndshield.com>');
    expect(transactionalFrom('Contact')).toBe('HoundShield Contact <noreply@houndshield.com>');
  });

  it('ignores a blank label rather than emitting a trailing space', () => {
    expect(transactionalFrom('   ')).toBe('HoundShield <noreply@houndshield.com>');
  });

  it('signs as a named person, never as a company or a team', () => {
    const sig = founderSignature();
    expect(sig).toBe('Gaurav\nFounder, HoundShield');
    expect(sig).not.toMatch(/team|support|no-?reply/i);
  });
});
