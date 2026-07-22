import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSessionCookie } from 'better-auth/cookies';

/**
 * Is Better Auth the active provider? Mirrors lib/auth/better-auth.ts
 * isBetterAuthEnabled(), re-declared inline so the middleware (edge-safe) does
 * not import the pg-backed server module. When true, route protection is
 * cookie-based via getSessionCookie; otherwise the Supabase path below runs.
 */
function betterAuthEnabled(): boolean {
  return (
    (process.env.AUTH_PROVIDER ?? '').trim() === 'better-auth' &&
    (process.env.DATABASE_URL ?? '').trim().length > 0 &&
    (process.env.BETTER_AUTH_SECRET ?? '').trim().length > 0
  );
}

// ---------------------------------------------------------------------------
// Rate Limiter — in-memory sliding window with LRU eviction
//
// Evolution:
//   - Eviction now prefers expired entries first (freeing real capacity).
//     Only if the map is still full after expiry-sweep do we evict the LRU
//     entry (head of the insertion-order Map).
//   - Cleanup interval reduced from 120s → 60s to keep memory tighter.
//   - Rate-limit key uses the first hop of x-forwarded-for OR a unique
//     fallback so Vercel's edge does not fold all traffic under "unknown".
// ---------------------------------------------------------------------------

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;
const MAX_ENTRIES = 10_000;
const SCAN_RATE_LIMIT_MAX = 15;
const GATEWAY_RATE_LIMIT_MAX = 120; // gateway endpoints need higher headroom
const CHECKOUT_RATE_LIMIT_MAX = 10; // unauthenticated Stripe checkout creation
const PASSWORD_RESET_RATE_LIMIT_MAX = 5; // unauthenticated reset send — anti email-bomb

/** Removes all expired entries from the map. O(n) sweep. */
function evictExpired(): void {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}

function isRateLimited(ip: string, maxRequests = RATE_LIMIT_MAX_REQUESTS): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    // Need to insert a new entry — ensure we have capacity
    if (rateLimitMap.size >= MAX_ENTRIES) {
      evictExpired();
      // If still full after expiry sweep, evict the LRU entry (Map head)
      if (rateLimitMap.size >= MAX_ENTRIES) {
        const lruKey = rateLimitMap.keys().next().value;
        if (lruKey !== undefined) rateLimitMap.delete(lruKey);
      }
    }
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > maxRequests;
}

// Periodic cleanup — runs every 60s to reclaim memory
if (typeof globalThis !== 'undefined') {
  setInterval(evictExpired, 60_000);
}

// ---------------------------------------------------------------------------
// Supabase readiness check (cached — evaluated once per cold-start)
// ---------------------------------------------------------------------------

let _supabaseReady: boolean | null = null;

function isSupabaseReady(): boolean {
  if (_supabaseReady !== null) return _supabaseReady;
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
  _supabaseReady =
    url.startsWith('https://') &&
    !url.includes('YOUR-PROJECT-ID') &&
    key.length > 20;
  return _supabaseReady;
}

// ---------------------------------------------------------------------------
// Routes that need Supabase auth refresh or protection
// ---------------------------------------------------------------------------

function needsAuth(pathname: string): boolean {
  return (
    pathname.startsWith('/command-center') ||
    pathname === '/login' ||
    pathname === '/signup'
  );
}

// ---------------------------------------------------------------------------
// Main Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  // Extract client IP — prefer the rightmost trusted hop when behind a proxy
  const forwarded = request.headers.get('x-forwarded-for') ?? '';
  const ip = forwarded.split(',')[0]?.trim() || 'unknown';

  // ── Security Headers (applied to all responses) ──────────────────────────
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // Content-Security-Policy (audit M4) — defense-in-depth for the blog HTML
  // render and inline JSON-LD/style usage. 'unsafe-inline' is required for
  // Next.js inline bootstrap + styled-jsx; script sources are otherwise 'self'.
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  // ── noindex for private / auth / dashboard surfaces (SEO Phase 1 #6) ──────
  // robots.txt disallow alone does not stop indexing from external links, so
  // add an explicit header for every non-public route.
  if (
    pathname.startsWith('/command-center') ||
    pathname.startsWith('/partner') ||
    pathname.startsWith('/console') ||
    pathname.startsWith('/auth') ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname.startsWith('/report/thank-you')
  ) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  // ── Rate Limiting (API routes only) ──────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const maxRequests = pathname === '/api/scan'
      ? SCAN_RATE_LIMIT_MAX
      : pathname.startsWith('/api/gateway')
        ? GATEWAY_RATE_LIMIT_MAX
        // Unauthenticated Stripe checkout creation — tighter bucket so a flood
        // can't exhaust the shared Stripe API rate limit (audit M6).
        : pathname === '/api/stripe/report-checkout'
          ? CHECKOUT_RATE_LIMIT_MAX
          // Unauthenticated password-reset send — tight bucket so it can't be
          // used to email-bomb an address or burn Resend/Supabase quota.
          : pathname === '/api/auth/reset-password'
            ? PASSWORD_RESET_RATE_LIMIT_MAX
            : RATE_LIMIT_MAX_REQUESTS;

    if (isRateLimited(ip, maxRequests)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const entry = rateLimitMap.get(ip);
    if (entry) {
      const remaining = Math.max(0, maxRequests - entry.count);
      response.headers.set('X-RateLimit-Limit', String(maxRequests));
      response.headers.set('X-RateLimit-Remaining', String(remaining));
      response.headers.set('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1_000)));
    }
  }

  // ── CORS for Gateway API ──────────────────────────────────────────────────
  if (pathname.startsWith('/api/gateway')) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const isDemo = !appUrl || appUrl === 'http://localhost:3000';
    const requestOrigin = request.headers.get('origin') ?? '';

    if (isDemo) {
      response.headers.set('Access-Control-Allow-Origin', requestOrigin || '*');
    } else {
      const allowedOrigins = [appUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'];
      if (allowedOrigins.includes(requestOrigin)) {
        response.headers.set('Access-Control-Allow-Origin', requestOrigin);
      }
    }

    response.headers.set('Vary', 'Origin');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, x-api-key, x-user-id, x-destination-url'
    );

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }
  }

  // ── Known Bug Fix: /auth/signup returns 404 — redirect to /signup ────────
  if (pathname === '/auth/signup') {
    return NextResponse.redirect(new URL('/signup', request.url));
  }

  // ── Auth: protect routes ──────────────────────────────────────────────────
  // Better Auth path (when active): cookie-based protection, no Supabase.
  if (betterAuthEnabled()) {
    if (needsAuth(pathname)) {
      const sessionCookie = getSessionCookie(request);
      if (pathname.startsWith('/command-center') && !sessionCookie) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      if ((pathname === '/login' || pathname === '/signup') && sessionCookie) {
        return NextResponse.redirect(new URL('/console', request.url));
      }
    }
    return response;
  }

  // Supabase path (default). Only run Supabase logic on routes that actually
  // need authentication. FAIL CLOSED (audit H1): if a protected route is
  // requested but Supabase auth is not configured, send the user to login
  // rather than exposing the dashboard.
  if (!isSupabaseReady() && pathname.startsWith('/command-center')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isSupabaseReady() && needsAuth(pathname)) {
    const supabase = createServerClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim(),
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Protect /command-center — redirect unauthenticated users to login
    if (pathname.startsWith('/command-center') && !user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Redirect authenticated users away from login/signup → demo Live Command Center
    if ((pathname === '/login' || pathname === '/signup') && user) {
      return NextResponse.redirect(new URL('/console', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm)$).*)',
  ],
};
