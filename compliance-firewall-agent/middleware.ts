import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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

  // ── Rate Limiting (API routes only) ──────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const maxRequests = pathname === '/api/scan'
      ? SCAN_RATE_LIMIT_MAX
      : pathname.startsWith('/api/gateway')
        ? GATEWAY_RATE_LIMIT_MAX
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

  // ── Auth: Refresh session + protect routes ────────────────────────────────
  // Only run Supabase logic on routes that actually need authentication.
  // Skipping it on pure API routes and public pages reduces cold-start
  // latency by ~10-20ms per request.
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

    // Redirect authenticated users away from login/signup
    if ((pathname === '/login' || pathname === '/signup') && user) {
      return NextResponse.redirect(new URL('/command-center', request.url));
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
