import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * LRU-bounded in-memory rate limiter.
 * Tracks request counts per IP with a fixed window.
 * Caps at MAX_ENTRIES to prevent memory leaks from unique IPs.
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 req/min per IP
const MAX_ENTRIES = 10_000; // cap map size to prevent memory exhaustion

// Stricter limit for public endpoints (unauthenticated)
const SCAN_RATE_LIMIT_MAX = 15; // 15 req/min for /api/scan

function isRateLimited(ip: string, maxRequests = RATE_LIMIT_MAX_REQUESTS): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    // Evict oldest entries if map is full
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

// Cleanup expired entries every 2 minutes
if (typeof globalThis !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of rateLimitMap) {
      if (now > val.resetAt) rateLimitMap.delete(key);
    }
  }, 120_000);
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // === Security Headers (all routes) ===
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' wss: ws: https:; frame-ancestors 'none';"
  );

  // === Rate limiting for API routes ===
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // Apply stricter limits for public endpoints
    const isScanEndpoint = request.nextUrl.pathname === "/api/scan";
    const maxRequests = isScanEndpoint ? SCAN_RATE_LIMIT_MAX : RATE_LIMIT_MAX_REQUESTS;

    if (isRateLimited(ip, maxRequests)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    // Add rate limit info headers
    const entry = rateLimitMap.get(ip);
    if (entry) {
      response.headers.set("X-RateLimit-Limit", String(maxRequests));
      response.headers.set("X-RateLimit-Remaining", String(Math.max(0, maxRequests - entry.count)));
    }
  }

  // === CORS for the gateway API ===
  if (request.nextUrl.pathname.startsWith("/api/gateway")) {
    // In production, restrict CORS to the configured app URL.
    // In demo mode (no env set), allow all origins for development convenience.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const isDemo = !appUrl || appUrl === "http://localhost:3000";
    const requestOrigin = request.headers.get("origin") ?? "";

    if (isDemo) {
      response.headers.set("Access-Control-Allow-Origin", requestOrigin || "*");
    } else {
      // Only allow the configured app origin
      const allowedOrigins = [appUrl, "http://localhost:3000", "http://127.0.0.1:3000"];
      if (allowedOrigins.includes(requestOrigin)) {
        response.headers.set("Access-Control-Allow-Origin", requestOrigin);
      }
    }
    response.headers.set("Vary", "Origin");
    response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, x-api-key, x-user-id, x-destination-url"
    );

    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: response.headers,
      });
    }
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*", "/auth"],
};
