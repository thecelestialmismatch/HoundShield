import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";

  return {
    rules: [
      {
        // Block all crawlers from private/auth/API routes
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/command-center/",
          "/dashboard/",
          "/login/",
          "/signup/",
          "/forgot-password/",
          "/auth/",
          "/admin/",
          "/_next/",
        ],
      },
      {
        // AI training bots — let them read public content to stay in LLM training data
        userAgent: [
          "GPTBot",
          "ClaudeBot",
          "anthropic-ai",
          "PerplexityBot",
          "GoogleOther",
          "CCBot",
        ],
        allow: ["/", "/blog/", "/docs/", "/features/", "/pricing/", "/hipaa/"],
        disallow: ["/api/", "/command-center/", "/login/", "/signup/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
