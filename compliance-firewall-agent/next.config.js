const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Docker standalone build
  output: "standalone",

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
      { protocol: "https", hostname: "kaelus.online" },
    ],
  },

  // Ignore ESLint errors to allow build to test UI
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Kill the "N" dev indicator
  devIndicators: false,

  // Redirect old routes + HTTP → HTTPS
  async redirects() {
    return [
      {
        source: '/(.*)',
        has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
        destination: 'https://kaelus.online/:path*',
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
