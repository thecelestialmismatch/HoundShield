import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "./blog/posts/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date("2026-05-09"), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/features`, lastModified: new Date("2026-05-09"), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/hipaa`, lastModified: new Date("2026-05-09"), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/pricing`, lastModified: new Date("2026-05-01"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/partners`, lastModified: new Date("2026-05-01"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/docs`, lastModified: new Date("2026-05-09"), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/demo`, lastModified: new Date("2026-05-01"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: new Date("2026-05-01"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date("2026-05-01"), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/blog`, lastModified: new Date("2026-05-09"), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/privacy`, lastModified: new Date("2026-04-01"), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date("2026-04-01"), changeFrequency: "yearly", priority: 0.3 },
  ];

  const blogRoutes: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // NOTE: /login /signup /forgot-password /command-center excluded —
  // auth-gated routes waste crawl budget and are blocked in robots.ts
  return [...staticRoutes, ...blogRoutes];
}
