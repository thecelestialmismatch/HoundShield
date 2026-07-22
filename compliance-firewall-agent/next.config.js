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
  // as its own CI step (`npm run lint` → eslint.config.mjs). TS errors are still
  // ignored at build so a type slip can't block a deploy (CI's tsc step gates that).
  typescript: {
    ignoreBuildErrors: true,
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
      {
        // Canonical host: consolidate www → non-www so search engines and
        // AI crawlers index one URL (no duplicate-content split).
        source: '/:path*',
        has: [{ type: 'host', value: 'www.houndshield.com' }],
        destination: 'https://houndshield.com/:path*',
        permanent: true,
      },
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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://openrouter.ai https://bytez.com",
              "media-src 'self' https://d8j0ntlcm91z4.cloudfront.net",
              "frame-ancestors 'none'",
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
