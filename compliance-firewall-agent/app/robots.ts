import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Block auth-gated routes (waste crawl budget, return 401/redirect)
        // Block API routes (not indexable content)
        disallow: [
          "/api/",
          "/command-center/",
          "/dashboard/",
          "/login",
          "/signup",
          "/forgot-password",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
