import { NextRequest } from 'next/server';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

/**
 * The unsubscribe endpoint, exercised as a route rather than as a module.
 *
 * `app/__tests__/marketing-email-contract.test.ts` proves the TOKEN maths and
 * greps the drip's source for the gate. Neither shows that a click actually
 * records anything — and the end-to-end run against a local server could only
 * reach the 503 branch, because there is no database on this machine. So the
 * write itself is asserted here against a mocked service client: the column, the
 * row it is scoped to, and the four ways the endpoint must refuse.
 *
 * The failure this is really guarding against is the quiet one: an endpoint that
 * renders "You are unsubscribed" while writing nothing. CAN-SPAM
 * 15 U.S.C. 7704(a)(4) is not satisfied by a confirmation page.
 */

const mockEq = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ update: mockUpdate }));
const mockIsConfigured = vi.fn(() => true);

vi.mock('@/lib/supabase/client', () => ({
  createServiceClient: vi.fn(() => ({ from: mockFrom })),
  isSupabaseConfigured: () => mockIsConfigured(),
}));

const SECRET = 'test-unsubscribe-secret';
const USER = 'user-1';

let GET: (req: NextRequest) => Promise<Response>;
let POST: (req: NextRequest) => Promise<Response>;
let token: string;
let savedSecret: string | undefined;

function request(url: string): NextRequest {
  return new NextRequest(url);
}

function validUrl(user = USER, t = token): string {
  return `http://localhost/api/email/unsubscribe?u=${encodeURIComponent(user)}&t=${t}`;
}

beforeEach(async () => {
  vi.clearAllMocks();
  mockIsConfigured.mockReturnValue(true);
  mockEq.mockResolvedValue({ error: null });

  savedSecret = process.env.UNSUBSCRIBE_SECRET;
  process.env.UNSUBSCRIBE_SECRET = SECRET;

  vi.resetModules();
  ({ GET, POST } = await import('../route'));
  const { unsubscribeToken } = await import('@/lib/legal/marketing-email');
  token = unsubscribeToken(USER)!;
});

afterEach(() => {
  if (savedSecret === undefined) delete process.env.UNSUBSCRIBE_SECRET;
  else process.env.UNSUBSCRIBE_SECRET = savedSecret;
});

describe('GET /api/email/unsubscribe', () => {
  it('records the opt-out against exactly that recipient', async () => {
    const res = await GET(request(validUrl()));

    expect(res.status).toBe(200);
    expect(await res.text()).toMatch(/You are unsubscribed/);
    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ marketing_opt_out_at: expect.any(String) }),
    );
    // Scoped to one row. An unscoped update here would opt the entire user
    // table out of onboarding email on a single stranger's click.
    expect(mockEq).toHaveBeenCalledWith('id', USER);
  });

  it('tells the recipient the opt-out does not stop account mail', async () => {
    // Otherwise someone unsubscribing from onboarding reasonably believes they
    // have also stopped receipts and password resets, which we must keep sending.
    const body = await (await GET(request(validUrl()))).text();
    expect(body).toMatch(/receipts/i);
  });

  it('is idempotent — a second click is still a success', async () => {
    // RFC 8058 providers retry the POST, and a human may click twice.
    expect((await GET(request(validUrl()))).status).toBe(200);
    expect((await GET(request(validUrl()))).status).toBe(200);
    expect(mockEq).toHaveBeenCalledTimes(2);
  });

  it('refuses a forged token and writes nothing', async () => {
    const forged = 'f'.repeat(token.length);
    const res = await GET(request(validUrl(USER, forged)));

    expect(res.status).toBe(400);
    expect(await res.text()).toMatch(/not valid/i);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("refuses one recipient's token used against another's id", async () => {
    // The endpoint is unauthenticated by necessity — 7704(a)(3) forbids making
    // the recipient do anything beyond visiting the link — so the token is the
    // only thing standing between a stranger and unsubscribing someone else.
    const res = await GET(request(validUrl('user-2', token)));

    expect(res.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('refuses a request with no id or no token', async () => {
    expect((await GET(request('http://localhost/api/email/unsubscribe'))).status).toBe(400);
    expect((await GET(request(`http://localhost/api/email/unsubscribe?u=${USER}`))).status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('fails LOUD when the database is unreachable', async () => {
    // The one outcome worse than an error page is a confirmation page for an
    // opt-out that was never stored.
    mockEq.mockResolvedValue({ error: { message: 'connection refused' } });
    const res = await GET(request(validUrl()));

    expect(res.status).toBe(503);
    const body = await res.text();
    expect(body).not.toMatch(/You are unsubscribed/);
    expect(body).toMatch(/could not record/i);
  });

  it('fails LOUD when Supabase is not configured at all', async () => {
    mockIsConfigured.mockReturnValue(false);
    const res = await GET(request(validUrl()));

    expect(res.status).toBe(503);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('never leaks the failure detail to the recipient', async () => {
    mockEq.mockResolvedValue({ error: { message: 'relation "profiles" does not exist' } });
    const body = await (await GET(request(validUrl()))).text();
    expect(body).not.toMatch(/relation|does not exist/i);
  });

  it('is not indexable', async () => {
    // A signed opt-out URL in a search index is an invitation to unsubscribe
    // someone by crawling.
    expect(await (await GET(request(validUrl()))).text()).toMatch(/name="robots" content="noindex"/);
  });
});

describe('POST /api/email/unsubscribe (RFC 8058 one-click)', () => {
  it('records the opt-out the same way the link does', async () => {
    // Gmail and Yahoo invoke POST on the recipient's behalf; if only GET worked,
    // one-click would silently do nothing for most of the recipient list.
    const res = await POST(request(validUrl()));

    expect(res.status).toBe(200);
    expect(mockEq).toHaveBeenCalledWith('id', USER);
  });

  it('refuses a forged token', async () => {
    const res = await POST(request(validUrl(USER, 'a'.repeat(token.length))));
    expect(res.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
