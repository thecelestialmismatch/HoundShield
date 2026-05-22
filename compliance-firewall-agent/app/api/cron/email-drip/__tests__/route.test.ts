import { NextRequest } from 'next/server';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockSend = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: mockSend } })),
}));

const mockFrom = jest.fn();
const mockSupabaseChain = {
  select: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
};
jest.mock('@/lib/supabase/client', () => ({
  createServiceClient: jest.fn(() => ({
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
  Object.assign(process.env, overrides);
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  setEnv({ CRON_SECRET: 'test-secret', RESEND_API_KEY: 'test-key' });
  // Default: no pending rows
  mockSupabaseChain.lt.mockResolvedValue({ data: [], error: null });
  mockSupabaseChain.in.mockResolvedValue({ data: [], error: null });
});

describe('GET /api/cron/email-drip', () => {
  let GET: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    jest.resetModules();
    ({ GET } = await import('../route'));
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
    jest.resetModules();
    const { GET: freshGET } = await import('../route');
    const res = await freshGET(makeRequest('Bearer test-secret'));
    expect(res.status).toBe(503);
  });

  it('skips gracefully when RESEND_API_KEY not set', async () => {
    delete process.env.RESEND_API_KEY;
    jest.resetModules();
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
