import { NextRequest } from 'next/server';
import { vi, beforeEach, describe, it, expect } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockSend = vi.fn();
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: mockSend } };
  }),
}));

const mockFrom = vi.fn();
const mockSupabaseChain = {
  select: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
};
vi.mock('@/lib/supabase/client', () => ({
  createServiceClient: vi.fn(() => ({
    from: mockFrom.mockReturnValue(mockSupabaseChain),
  })),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(authHeader?: string): NextRequest {
  return new NextRequest('http://localhost/api/cron/email-drip', {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

function setEnv(overrides: Record<string, string | undefined>) {
  // DELETE on undefined. Object.assign would set the STRING "undefined", which
  // is truthy — a test meaning "this is unset" would silently assert the
  // opposite. (It did, until the CAN-SPAM gate tests caught it.)
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  // CAN-SPAM: the route now refuses to run without a postal address and a
  // signable unsubscribe link (15 U.S.C. 7704(a)(3),(a)(5)). These two vars are
  // what a lawful marketing send requires, so the happy path has to configure
  // them — see the "refuses to run" tests below for the unconfigured case.
  setEnv({
    CRON_SECRET: 'test-secret',
    RESEND_API_KEY: 'test-key',
    MARKETING_POSTAL_ADDRESS: 'HoundShield, 1 Example St, Wilmington DE 19801',
    UNSUBSCRIBE_SECRET: 'test-unsubscribe-secret',
  });
  // Default: no pending rows
  mockSupabaseChain.lt.mockResolvedValue({ data: [], error: null });
  mockSupabaseChain.in.mockResolvedValue({ data: [], error: null });
});

describe('GET /api/cron/email-drip', () => {
  let GET: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();
    ({ GET } = await import('../route'));
  });

  it('refuses to run with no postal address configured', async () => {
    // Fails CLOSED. Without an address there is no lawful commercial message to
    // send, so the correct behaviour is a no-op run, not a batch of violations.
    setEnv({ MARKETING_POSTAL_ADDRESS: undefined });
    vi.resetModules();
    ({ GET } = await import('../route'));

    const res = await GET(makeRequest('Bearer test-secret'));
    const body = await res.json();

    expect(body.skipped).toBe(true);
    expect(body.reason).toMatch(/postal address/i);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('refuses to run when unsubscribe links cannot be signed', async () => {
    setEnv({ UNSUBSCRIBE_SECRET: undefined, SUPABASE_SERVICE_ROLE_KEY: undefined });
    vi.resetModules();
    ({ GET } = await import('../route'));

    const res = await GET(makeRequest('Bearer test-secret'));
    const body = await res.json();

    expect(body.skipped).toBe(true);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('returns 401 with wrong secret', async () => {
    const res = await GET(makeRequest('Bearer wrong'));
    expect(res.status).toBe(401);
  });

  it('returns 401 with missing auth header', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns 503 when CRON_SECRET not set', async () => {
    delete process.env.CRON_SECRET;
    vi.resetModules();
    const { GET: freshGET } = await import('../route');
    const res = await freshGET(makeRequest('Bearer test-secret'));
    expect(res.status).toBe(503);
  });

  it('skips gracefully when RESEND_API_KEY not set', async () => {
    delete process.env.RESEND_API_KEY;
    vi.resetModules();
    const { GET: freshGET } = await import('../route');
    const res = await freshGET(makeRequest('Bearer test-secret'));
    const body = await res.json();
    expect(body.skipped).toBe(true);
  });

  it('returns ok:true with no pending rows', async () => {
    const res = await GET(makeRequest('Bearer test-secret'));
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.day3.sent).toBe(0);
    expect(body.day7.sent).toBe(0);
  });

  it('sends day3 email and stamps sent_at only after success', async () => {
    const threeDaysAgo = new Date(Date.now() - 4 * 86_400_000).toISOString();
    // Only return a pending day3 row; day7 stays empty
    mockSupabaseChain.lt
      .mockResolvedValueOnce({ data: [{ user_id: 'u1', enrolled_at: threeDaysAgo }], error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    mockSupabaseChain.in.mockResolvedValue({
      data: [{ id: 'u1', email: 'test@example.com', full_name: 'Test User', tier: 'free' }],
      error: null,
    });

    mockSend.mockResolvedValue({ data: { id: 'email-id' }, error: null });
    mockSupabaseChain.eq.mockResolvedValue({ error: null });

    const res = await GET(makeRequest('Bearer test-secret'));
    const body = await res.json();

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend.mock.calls[0][0].to).toBe('test@example.com');
    expect(body.day3.sent).toBe(1);
    // Verify eq was called to stamp sent_at (update chain)
    expect(mockSupabaseChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ day3_sent_at: expect.any(String) }),
    );
  });

  it('appends the unsubscribe footer and RFC 8058 headers to what it sends', async () => {
    // The statutory elements ride on the SEND, not on the template. Asserting
    // them here is what makes the source-grep in the CAN-SPAM contract test more
    // than a promise.
    const threeDaysAgo = new Date(Date.now() - 4 * 86_400_000).toISOString();
    mockSupabaseChain.lt
      .mockResolvedValueOnce({ data: [{ user_id: 'u1', enrolled_at: threeDaysAgo }], error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    mockSupabaseChain.in.mockResolvedValue({
      data: [{ id: 'u1', email: 'test@example.com', full_name: 'Test User', tier: 'free' }],
      error: null,
    });
    mockSend.mockResolvedValue({ data: { id: 'email-id' }, error: null });
    mockSupabaseChain.eq.mockResolvedValue({ error: null });

    await GET(makeRequest('Bearer test-secret'));

    const sent = mockSend.mock.calls[0][0];
    expect(sent.html).toContain('/api/email/unsubscribe');
    expect(sent.html).toContain('Wilmington DE 19801'); // 7704(a)(5) postal address
    expect(sent.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
  });

  it('skips a recipient who has already opted out', async () => {
    // 7704(a)(4) allows 10 business days to honour an opt-out. Filtering at send
    // time makes the answer "immediately" and removes the clock entirely.
    const threeDaysAgo = new Date(Date.now() - 4 * 86_400_000).toISOString();
    mockSupabaseChain.lt
      .mockResolvedValueOnce({ data: [{ user_id: 'u1', enrolled_at: threeDaysAgo }], error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    mockSupabaseChain.in.mockResolvedValue({
      data: [
        {
          id: 'u1',
          email: 'optedout@example.com',
          full_name: 'Opted Out',
          tier: 'free',
          marketing_opt_out_at: new Date().toISOString(),
        },
      ],
      error: null,
    });

    const body = await (await GET(makeRequest('Bearer test-secret'))).json();

    expect(mockSend).not.toHaveBeenCalled();
    expect(body.day3.sent).toBe(0);
    expect(body.day3.skipped).toBe(1);
    // And the row is NOT stamped, so the opt-out is not quietly consumed as if
    // the message had been delivered.
    expect(mockSupabaseChain.update).not.toHaveBeenCalled();
  });

  it('does not stamp sent_at when Resend returns an error', async () => {
    const threeDaysAgo = new Date(Date.now() - 4 * 86_400_000).toISOString();
    mockSupabaseChain.lt
      .mockResolvedValueOnce({ data: [{ user_id: 'u1', enrolled_at: threeDaysAgo }], error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    mockSupabaseChain.in.mockResolvedValue({
      data: [{ id: 'u1', email: 'test@example.com', full_name: 'Test', tier: 'pro' }],
      error: null,
    });

    mockSend.mockResolvedValue({ data: null, error: { message: 'rate limited' } });

    const res = await GET(makeRequest('Bearer test-secret'));
    const body = await res.json();

    expect(body.day3.skipped).toBe(1);
    // update must NOT have been called — no stamp on failed send
    expect(mockSupabaseChain.update).not.toHaveBeenCalled();
  });
});
