import { describe, it, expect } from 'vitest';
import { confirmRedirect, confirmFailureRedirect } from '../confirm-redirect';

describe('confirmRedirect — success destination', () => {
  it('sends recovery links to the set-a-new-password page', () => {
    expect(confirmRedirect('recovery', null)).toBe('/reset-password');
  });

  it('sends non-recovery confirmations (signup/email) to the app', () => {
    expect(confirmRedirect('signup', null)).toBe('/console');
    expect(confirmRedirect('email', null)).toBe('/console');
    expect(confirmRedirect(null, null)).toBe('/console');
  });

  it('honours an explicit, safe relative next over the type default', () => {
    expect(confirmRedirect('recovery', '/reset-password')).toBe('/reset-password');
    expect(confirmRedirect('signup', '/command-center/settings')).toBe('/command-center/settings');
  });

  it('rejects open-redirect next values and falls back to the type default', () => {
    expect(confirmRedirect('recovery', '//evil.com')).toBe('/reset-password');
    expect(confirmRedirect('recovery', 'https://evil.com')).toBe('/reset-password');
    expect(confirmRedirect('signup', 'http://evil.com/x')).toBe('/console');
    expect(confirmRedirect('recovery', 'evil.com')).toBe('/reset-password'); // not slash-prefixed
    expect(confirmRedirect('signup', '')).toBe('/console');
  });
});

describe('confirmFailureRedirect — verification failed / malformed link', () => {
  it('returns recovery failures to /reset-password (renders "Link expired")', () => {
    expect(confirmFailureRedirect('recovery')).toBe('/reset-password?error=INVALID_TOKEN');
  });

  it('returns other failures to login', () => {
    expect(confirmFailureRedirect('signup')).toBe('/login?error=auth_failed');
    expect(confirmFailureRedirect(null)).toBe('/login?error=auth_failed');
  });
});
