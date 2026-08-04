/**
 * POST /api/v1/chat/completions — the interception is RECORDED.
 *
 * This is the regression test for the defect that made the Command Center
 * dashboard structurally empty: the OpenAI-compatible proxy — the URL customers
 * actually point their client at, and the only rail that carries real traffic —
 * scanned every prompt, decided ALLOWED/BLOCKED/QUARANTINED, returned an
 * `X-HoundShield-Request-Id` documented as an "opaque request identifier for
 * audit lookup", and then wrote nothing at all. `compliance_events` could never
 * receive a row, so the dashboard's "no traffic yet" state was permanent and
 * the SHA-256 hash-chained audit log — the artifact this product is sold on —
 * was not being produced.
 *
 * Every test below fails against that version of the route.
 */

const {
  mockClassify,
  mockResolveKey,
  mockTier,
  mockCanAccess,
  mockRateLimit,
  mockRecord,
  mockFetch,
} = vi.hoisted(() => ({
  mockClassify: vi.fn(),
  mockResolveKey: vi.fn(),
  mockTier: vi.fn(),
  mockCanAccess: vi.fn(() => true),
  mockRateLimit: vi.fn(async () => null),
  mockRecord: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock('@/lib/classifier/risk-engine', () => ({
  classifyRisk: (t: string) => mockClassify(t),
}));
vi.mock('@/lib/gateway/api-key', () => ({
  resolveApiKey: (k: string) => mockResolveKey(k),
  ApiKeyBackendUnavailable: class extends Error {},
}));
vi.mock('@/lib/subscription/check', () => ({
  getUserSubscription: (u: string) => mockTier(u),
  canAccessGateway: (t: string) => mockCanAccess(t),
}));
vi.mock('@/lib/rate-limit-shared', () => ({
  enforceRateLimit: () => mockRateLimit(),
  identifierFor: () => 'id',
  clientIp: () => '127.0.0.1',
  LLM_RATE_LIMITS: { gateway: { limit: 100, windowSec: 60 } },
}));
vi.mock('@/lib/audit/record-decision', () => ({
  recordGatewayDecision: (d: unknown) => mockRecord(d),
}));

import { POST } from '@/app/api/v1/chat/completions/route';
import { NextRequest } from 'next/server';

const CLEAN = {
  risk_level: 'NONE',
  classifications: [],
  entities: [],
  confidence: 1,
  should_block: false,
  should_quarantine: false,
  matched_rules: [],
};
const BLOCKING = { ...CLEAN, risk_level: 'CRITICAL', classifications: ['PII'], should_block: true };
const HOLDING = { ...CLEAN, risk_level: 'HIGH', should_quarantine: true };

const PROMPT = 'My SSN is 123-45-6789';

function req(overrides: { model?: string; provider?: string; stream?: boolean } = {}) {
  return new NextRequest('http://localhost/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: 'Bearer hs_live_realkey',
      'x-provider-api-key': 'sk-upstream',
      'content-type': 'application/json',
      ...(overrides.provider ? { 'x-provider': overrides.provider } : {}),
    },
    body: JSON.stringify({
      model: overrides.model ?? 'gpt-4o-mini',
      messages: [{ role: 'user', content: PROMPT }],
      ...(overrides.stream ? { stream: true } : {}),
    }),
  });
}

describe('POST /api/v1/chat/completions — audit record', () => {
  beforeEach(() => {
    mockClassify.mockReset().mockResolvedValue(CLEAN);
    mockResolveKey.mockReset().mockResolvedValue({ userId: 'user-abc', keyId: 'k1', demo: false });
    mockTier.mockReset().mockResolvedValue('pro');
    mockCanAccess.mockReset().mockReturnValue(true);
    mockRateLimit.mockReset().mockResolvedValue(null);
    mockRecord.mockReset().mockResolvedValue({ eventId: 'evt-1', quarantineId: null, error: null });
    mockFetch.mockReset().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'hi' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 5, completion_tokens: 2 },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', mockFetch);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('records a BLOCKED interception — the whole point of the product', async () => {
    mockClassify.mockResolvedValue(BLOCKING);

    const res = await POST(req());

    expect(res.status).toBe(403);
    expect(mockRecord).toHaveBeenCalledTimes(1);
    expect(mockRecord.mock.calls[0][0]).toMatchObject({
      userId: 'user-abc',
      action: 'BLOCKED',
      destination: 'openai',
      prompt: PROMPT,
    });
  });

  it('records a QUARANTINED interception', async () => {
    mockClassify.mockResolvedValue(HOLDING);

    const res = await POST(req());

    expect(res.status).toBe(202);
    expect(mockRecord.mock.calls[0][0]).toMatchObject({ action: 'QUARANTINED' });
  });

  it('records an ALLOWED interception — "nothing detected" is the evidence the control ran', async () => {
    const res = await POST(req());

    expect(res.status).toBe(200);
    expect(mockRecord).toHaveBeenCalledTimes(1);
    expect(mockRecord.mock.calls[0][0]).toMatchObject({ action: 'ALLOWED' });
  });

  it('records the streaming path too — a stream is still an interception', async () => {
    await POST(req({ stream: true }));
    expect(mockRecord).toHaveBeenCalledTimes(1);
  });

  it('records BEFORE the prompt is forwarded upstream', async () => {
    const order: string[] = [];
    mockRecord.mockImplementation(async () => {
      order.push('record');
      return { eventId: 'evt-1', quarantineId: null, error: null };
    });
    mockFetch.mockImplementation(async () => {
      order.push('upstream');
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: 'hi' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 1, completion_tokens: 1 },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    });

    await POST(req());

    expect(order).toEqual(['record', 'upstream']);
  });

  it('names the destination provider the prompt was headed to, even when blocked', async () => {
    mockClassify.mockResolvedValue(BLOCKING);
    await POST(req({ model: 'claude-3-5-sonnet', provider: 'anthropic' }));
    expect(mockRecord.mock.calls[0][0]).toMatchObject({ destination: 'anthropic' });
  });

  it('uses the SERVER-resolved identity, never a client-supplied one', async () => {
    mockResolveKey.mockResolvedValue({ userId: 'real-owner', keyId: 'k1', demo: false });
    await POST(req());
    expect(mockRecord.mock.calls[0][0]).toMatchObject({ userId: 'real-owner' });
  });

  // ── Disclosure ─────────────────────────────────────────────────────────────
  it('discloses a successful record as X-HoundShield-Audit: recorded', async () => {
    const res = await POST(req());
    expect(res.headers.get('X-HoundShield-Audit')).toBe('recorded');
  });

  it('discloses a degraded write rather than implying the request was recorded', async () => {
    mockRecord.mockResolvedValue({ eventId: null, quarantineId: null, error: 'db down' });

    const res = await POST(req());

    expect(res.status).toBe(200); // the proxy still serves the customer
    expect(res.headers.get('X-HoundShield-Audit')).toBe('degraded');
  });

  it('a degraded audit write does NOT unblock a prompt that must be blocked', async () => {
    mockClassify.mockResolvedValue(BLOCKING);
    mockRecord.mockResolvedValue({ eventId: null, quarantineId: null, error: 'db down' });

    const res = await POST(req());

    expect(res.status).toBe(403);
    expect(res.headers.get('X-HoundShield-Audit')).toBe('degraded');
  });

  // ── Nothing is recorded for traffic that never reached the scanner ─────────
  it('does not record when the key is rejected — there was no interception to log', async () => {
    mockResolveKey.mockResolvedValue(null);
    const res = await POST(req());
    expect(res.status).toBe(401);
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it('does not record when the plan gate rejects the caller', async () => {
    mockCanAccess.mockReturnValue(false);
    const res = await POST(req());
    expect(res.status).toBe(402);
    expect(mockRecord).not.toHaveBeenCalled();
  });
});
