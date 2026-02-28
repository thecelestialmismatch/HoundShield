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

  // Image optimization
  images: {
    unoptimized: true,
  },

  // Headers for security
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
