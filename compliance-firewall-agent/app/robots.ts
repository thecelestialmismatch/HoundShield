import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL;
  return {
    rules: [
      {
        // Block all crawlers from private/auth/API routes
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/command-center/",
          "/console/",
          "/partner/",
          "/dashboard/",
          "/login/",
          "/signup/",
          "/forgot-password/",
          "/auth/",
          "/admin/",
          "/report/thank-you/",
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
