import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/* ── Rate Limiter ─────────────────────────────────────────────── */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;
const MAX_ENTRIES = 10_000;
const SCAN_RATE_LIMIT_MAX = 15;

function isRateLimited(ip: string, maxRequests = RATE_LIMIT_MAX_REQUESTS): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    if (rateLimitMap.size >= MAX_ENTRIES) {
      const firstKey = rateLimitMap.keys().next().value;
      if (firstKey) rateLimitMap.delete(firstKey);
    }
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > maxRequests;
}

if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of rateLimitMap) {
      if (now > val.resetAt) rateLimitMap.delete(key);
    }
  }, 120_000);
}

/* ── Check if Supabase is configured ──────────────────────────── */
function isSupabaseReady(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return url.startsWith('https://') && !url.includes('YOUR-PROJECT-ID') && key.length > 20;
}

/* ── Main Middleware ───────────────────────────────────────────── */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { pathname } = request.nextUrl;

  // ── Security Headers ──
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // ── Rate Limiting for API routes ──
  if (pathname.startsWith('/api/')) {
    const isScanEndpoint = pathname === '/api/scan';
    const maxRequests = isScanEndpoint ? SCAN_RATE_LIMIT_MAX : RATE_LIMIT_MAX_REQUESTS;
    if (isRateLimited(ip, maxRequests)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
    const entry = rateLimitMap.get(ip);
    if (entry) {
      response.headers.set('X-RateLimit-Limit', String(maxRequests));
      response.headers.set('X-RateLimit-Remaining', String(Math.max(0, maxRequests - entry.count)));
    }
  }

  // ── CORS for Gateway API ──
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
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key, x-user-id, x-destination-url');
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }
  }

  // ── Auth: Refresh session + protect /command-center ──
  if (isSupabaseReady()) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    // Refresh session (important for keeping tokens alive)
    const { data: { user } } = await supabase.auth.getUser();

    // Protect command center routes — redirect to login if not authenticated
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
    // Match all paths except static files and images
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm)$).*)',
  ],
};
