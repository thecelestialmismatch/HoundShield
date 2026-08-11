/**
 * The browser-side caller and its 501 fallback.
 *
 * The security-relevant assertion is the negative one: a NETWORK FAILURE must
 * NOT be reported as `unavailable`. If it were, an attacker could switch off
 * every rate limit, lockout and timing floor simply by making the request fail
 * — the browser would quietly revert to the unlimited direct-to-GoTrue path.
 * Only an explicit 501 from our own server is a fallback signal.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { postAuth } from '@/lib/auth/server-auth-client';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('postAuth', () => {
  it('POSTs JSON to the given path', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ ok: true }, 200));
    await postAuth('/api/auth/login', { email: 'a@b.com', password: 'pw' });

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/auth/login');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body as string)).toEqual({ email: 'a@b.com', password: 'pw' });
  });

  it('returns ok with the parsed body on 200', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ ok: true, next: '/x' }, 200));
    const out = await postAuth('/api/auth/signup', {});
    expect(out).toEqual({ kind: 'ok', data: { ok: true, next: '/x' } });
  });

  it('reports unavailable on 501 — the one legitimate fallback signal', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ error: 'disabled' }, 501));
    expect(await postAuth('/api/auth/login', {})).toEqual({ kind: 'unavailable' });
  });

  it('does NOT report unavailable on a network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    const out = await postAuth('/api/auth/login', {});
    expect(out.kind).toBe('error');
    if (out.kind === 'error') {
      expect(out.status).toBe(0);
      expect(out.message.length).toBeGreaterThan(10);
    }
  });

  it('does NOT report unavailable on 500, 502 or 503 either', async () => {
    for (const status of [500, 502, 503]) {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ error: 'boom' }, status));
      const out = await postAuth('/api/auth/login', {});
      expect(out.kind).toBe('error');
    }
  });

  it('surfaces the server message on a 4xx', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      json({ error: 'That email and password don’t match an active account.' }, 401),
    );
    const out = await postAuth('/api/auth/login', {});
    expect(out).toEqual({
      kind: 'error',
      message: 'That email and password don’t match an active account.',
      status: 401,
      captchaRequired: false,
    });
  });

  it('flags captchaRequired so the caller can render the widget', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      json({ error: 'Please complete the verification challenge.', captchaRequired: true }, 400),
    );
    const out = await postAuth('/api/auth/login', {});
    expect(out.kind === 'error' && out.captchaRequired).toBe(true);
  });

  it('does not treat a truthy-but-not-true captchaRequired as a challenge', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      json({ error: 'x', captchaRequired: 'yes' }, 400),
    );
    const out = await postAuth('/api/auth/login', {});
    expect(out.kind === 'error' && out.captchaRequired).toBe(false);
  });

  it('falls back to a generic message when the body carries no usable error', async () => {
    for (const body of [{}, { error: '' }, { error: '   ' }, { error: 42 }]) {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(body, 400));
      const out = await postAuth('/api/auth/login', {});
      expect(out.kind).toBe('error');
      if (out.kind === 'error') expect(out.message.trim().length).toBeGreaterThan(10);
    }
  });

  it('treats an unparseable 2xx body as success', async () => {
    // 200 with an empty body, not 204: the Response constructor rejects a body
    // argument on a null-body status, so a 204 here throws in the test itself
    // and never reaches postAuth.
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 200 }));
    expect(await postAuth('/api/auth/login', {})).toEqual({ kind: 'ok', data: {} });
  });

  it('treats an unparseable error body as an error, not a fallback', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<html>502</html>', { status: 502 }));
    const out = await postAuth('/api/auth/login', {});
    expect(out.kind).toBe('error');
    if (out.kind === 'error') expect(out.status).toBe(502);
  });

  it('never throws — a caller must not be able to break sign-in with a bad response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('not json', { status: 200 }));
    await expect(postAuth('/api/auth/login', {})).resolves.toBeDefined();
  });
});
