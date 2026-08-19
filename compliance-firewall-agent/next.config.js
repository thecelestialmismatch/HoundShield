const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Docker standalone build
  output: "standalone",

  // Silence "inferred workspace root" warning — explicit root anchors file tracing
  outputFileTracingRoot: require("path").join(__dirname, "../"),

  // Dev server origins (allow all local access)
  allowedDevOrigins: [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:*",
    "http://localhost:*",
  ],

  // Performance optimizations
  poweredByHeader: false,
  compress: true,

  // Image optimization — enabled for Vercel (WebP, AVIF, auto-resize)
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "houndshield.com" },
    ],
  },

  // Next 16 removed `next build` linting and the `eslint` config key — lint runs
  // as its own CI step (`npm run lint` → eslint.config.mjs). TypeScript remains
  // release-blocking here as well: a CI configuration mistake must not let a
  // type error pass through `next build` into production.
  typescript: {
    ignoreBuildErrors: false,
  },

  // Kill the "N" dev indicator
  devIndicators: false,

  // HERMES design demo — byte-for-byte static port of HERMES-REDESIGN/houndshield-demo.html
  // Served verbatim from public/hermes-demo.html; these give it clean URLs.
  async rewrites() {
    return [
      { source: '/hermes', destination: '/hermes-demo.html' },
      { source: '/hermes-redesign', destination: '/hermes-demo.html' },
    ];
  },

  // Redirect old routes + HTTP → HTTPS
  async redirects() {
    return [
      // REMOVED: a www -> apex redirect. It pointed the WRONG WAY and, the
      // moment framework routing is restored, it is an infinite redirect loop
      // on every URL of the site.
      //
      // Measured against production on 2026-08-14:
      //   GET https://houndshield.com/api/health  ->  308  ->  www.houndshield.com
      // Vercel's own domain configuration canonicalises apex -> WWW. This rule
      // said www -> apex. Restoring the framework routing table (see
      // docs/DEPLOYMENT-MIDDLEWARE.md) would have made both live at once:
      // apex -> www -> apex -> www, forever, on every request.
      //
      // It has been dormant and therefore invisible only because the legacy
      // repo-root vercel.json stops next.config redirects reaching the edge —
      // the exact condition this PR removes. So deleting it is a PREREQUISITE
      // of that change, not a tidy-up alongside it.
      //
      // Direction is not a coin flip: Vercel 308s to www, CLAUDE.md records
      // `https://www.houndshield.com/` as canonical, and lib/gateway/base-url.ts
      // prints the www host to every customer. This rule was the only thing
      // claiming otherwise. Guard: app/__tests__/canonical-host.test.ts.
      {
        source: '/(.*)',
        has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
        destination: 'https://houndshield.com/:path*',
        permanent: true,
      },
      { source: '/dashboard', destination: '/command-center', permanent: true },
      { source: '/shieldready', destination: '/command-center', permanent: true },
      { source: '/shieldready/:path*', destination: '/command-center/shield/:path*', permanent: true },
    ];
  },

  // Headers for security
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          // Security headers — these MUST byte-match middleware.ts. Two layers on
          // purpose: middleware covers dynamic responses; this next.config layer
          // covers statically-generated pages served straight from Vercel's CDN
          // (where middleware is bypassed on cache hits). Identical values mean the
          // two layers can never contradict. Guard: app/__tests__/security-headers.test.ts.
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // 'unsafe-eval' REMOVED (audit #8b). It compounds with #2: the
              // session cookie is httpOnly:false by @supabase/ssr design, so it
              // is readable by JavaScript — meaning any XSS that lands is an
              // immediate account takeover rather than a contained defacement.
              // Of the two halves, tightening script-src is the tractable one
              // (see lib/supabase/server.ts for why the flag cannot be flipped).
              // Verified by measurement, not by reasoning: a production build
              // was served and driven with the on-disk Chromium over CDP across
              // /, /pricing, /login, /demo, /command-center/overview and
              // /status — zero CSP violations from application code. The run
              // carried its own control, because "no violations" is also what a
              // deaf detector reports: each page was made to request a script
              // from a forbidden origin, and all six refused it while quoting
              // this directive back. (Note for whoever repeats this: eval()
              // driven through DevTools is NOT a valid control — those contexts
              // are CSP-exempt and report success whatever the policy says.)
              // If a dependency ever needs eval again, put it back WITH THE
              // OFFENDER NAMED here — a directive removed until something
              // breaks is worse than one deliberately kept.
              // 'unsafe-inline' stays: a genuine Next.js App Router constraint
              // without nonce plumbing.
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://openrouter.ai https://bytez.com",
              "media-src 'self' https://d8j0ntlcm91z4.cloudfront.net",
              "frame-ancestors 'none'",
              // base-uri and form-action were present in middleware.ts but NOT
              // here, and middleware does not execute on this deployment — the
              // repo-root vercel.json uses the legacy `builds`/`routes` keys,
              // which replace the routing table middleware lives in. So both
              // directives read as covered in review while being absent on the
              // wire. Restated here, in the layer that actually ships.
              //
              // base-uri: without it, an injected <base href> silently
              //   re-points every relative script/form on the page at an
              //   attacker origin — which matters more than usual while
              //   script-src still carries 'unsafe-inline'.
              // form-action: without it, an injected form can post credentials
              //   off-site; CSP is the only thing that constrains where a form
              //   submits, as frame-ancestors and default-src do not apply.
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: true,
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true,
      automaticVercelMonitors: false,
    })
  : nextConfig;
