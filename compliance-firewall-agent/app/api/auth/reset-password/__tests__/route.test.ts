/**
 * Tests for POST /api/auth/reset-password.
 *
 * The route must be ENUMERATION-SAFE: a well-formed email always returns 200,
 * whether or not the account exists, and it must only actually send when a
 * recovery link was minted. Malformed input returns 4xx (leaks nothing about
 * account existence). generateLink failures/throws must never surface.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGenerateLink, mockSend, mockConfigured } = vi.hoisted(() => ({
  mockGenerateLink: vi.fn(),
  mockSend: vi.fn().mockResolvedValue(undefined),
  mockConfigured: vi.fn().mockReturnValue(true),
}));

vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: () => mockConfigured(),
  createServiceClient: () => ({ auth: { admin: { generateLink: mockGenerateLink } } }),
}));

vi.mock('@/lib/auth/auth-emails', () => ({
  sendPasswordResetEmail: (to: string, url: string) => mockSend(to, url),
}));

// Keep the real NextResponse; make after() run its callback synchronously WITHOUT
// awaiting it, mirroring production (the send fires but never blocks the response).
vi.mock('next/server', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('next/server');
  return { ...actual, after: (cb: () => unknown) => { cb(); } };
});

import { POST } from '@/app/api/auth/reset-password/route';

function req(body: unknown): Request {
  return new Request('http://localhost/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  mockGenerateLink.mockReset();
  mockSend.mockClear();
  mockConfigured.mockReturnValue(true);
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_APP_URL;
});

describe('POST /api/auth/reset-password', () => {
  it('sends a branded /auth/confirm link for an existing account (200)', async () => {
    mockGenerateLink.mockResolvedValue({ data: { properties: { hashed_token: 'tok_abc' } }, error: null });
    const res = await POST(req({ email: 'user@acme.com' }));
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledTimes(1);
    const [to, url] = mockSend.mock.calls[0];
    expect(to).toBe('user@acme.com');
    const u = new URL(url);
    expect(u.pathname).toBe('/auth/confirm');
    expect(u.searchParams.get('token_hash')).toBe('tok_abc');
    expect(u.searchParams.get('type')).toBe('recovery');
    expect(u.searchParams.get('next')).toBe('/reset-password');
  });

  it('is enumeration-safe: non-existent account still returns 200 and sends nothing', async () => {
    mockGenerateLink.mockResolvedValue({ data: null, error: { message: 'User not found' } });
    const res = await POST(req({ email: 'ghost@acme.com' }));
    expect(res.status).toBe(200);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('swallows a generateLink throw: still 200, no send, no crash', async () => {
    mockGenerateLink.mockRejectedValue(new Error('supabase down'));
    const res = await POST(req({ email: 'user@acme.com' }));
    expect(res.status).toBe(200);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('normalizes the email before sending (trim + lowercase)', async () => {
    mockGenerateLink.mockResolvedValue({ data: { properties: { hashed_token: 't' } }, error: null });
    await POST(req({ email: '  User@Acme.COM ' }));
    expect(mockGenerateLink).toHaveBeenCalledWith({ type: 'recovery', email: 'user@acme.com' });
    expect(mockSend.mock.calls[0][0]).toBe('user@acme.com');
  });

  it('rejects a malformed email with 400 and sends nothing', async () => {
    const res = await POST(req({ email: 'nope' }));
    expect(res.status).toBe(400);
    expect(mockGenerateLink).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('rejects a malformed JSON body with 400', async () => {
    const res = await POST(req('{not json'));
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('stays enumeration-safe when Supabase is not configured (200, no send)', async () => {
    mockConfigured.mockReturnValue(false);
    const res = await POST(req({ email: 'user@acme.com' }));
    expect(res.status).toBe(200);
    expect(mockGenerateLink).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('does not block the response on the email send (no enumeration timing oracle)', async () => {
    mockGenerateLink.mockResolvedValue({ data: { properties: { hashed_token: 't' } }, error: null });
    // A send that never settles — if it were awaited on the response path, POST would hang.
    mockSend.mockImplementationOnce(() => new Promise<void>(() => {}));
    const res = await POST(req({ email: 'user@acme.com' }));
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledTimes(1); // dispatched via after(), never awaited
  });

  it('uses NEXT_PUBLIC_APP_URL as the link base when set', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://www.houndshield.com';
    mockGenerateLink.mockResolvedValue({ data: { properties: { hashed_token: 't2' } }, error: null });
    await POST(req({ email: 'user@acme.com' }));
    expect(new URL(mockSend.mock.calls[0][1]).origin).toBe('https://www.houndshield.com');
  });
});
