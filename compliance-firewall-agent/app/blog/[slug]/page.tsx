import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import { getAllPosts, getPostBySlug } from "@/lib/blog/posts";

// ── Static params (build all posts at compile time) ───────────────────────────
export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

// ── Dynamic SEO metadata per post ─────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";
  const url = `${baseUrl}/blog/${post.slug}`;

  return {
    title: `${post.title} | HoundShield Blog`,
    description: post.description,
    keywords: post.tags,
    authors: [{ name: post.author }],
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url,
      publishedTime: post.date,
      modifiedTime: post.updatedDate ?? post.date,
      authors: [post.author],
      tags: post.tags,
      siteName: "HoundShield",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

// ── JSON-LD Article schema ─────────────────────────────────────────────────────
function ArticleJsonLd({ post }: { post: ReturnType<typeof getPostBySlug> }) {
  if (!post) return null;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    author: {
      "@type": "Organization",
      name: post.author,
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "HoundShield",
      url: baseUrl,
      logo: { "@type": "ImageObject", url: `${baseUrl}/logo.png` },
    },
    datePublished: post.date,
    dateModified: post.updatedDate ?? post.date,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${baseUrl}/blog/${post.slug}` },
    keywords: post.tags.join(", "),
    articleSection: post.category,
    timeRequired: `PT${post.readingTime}M`,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ── BreadcrumbList JSON-LD ────────────────────────────────────────────────────
function BreadcrumbJsonLd({ post }: { post: ReturnType<typeof getPostBySlug> }) {
  if (!post) return null;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${baseUrl}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${baseUrl}/blog/${post.slug}` },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const allPosts = getAllPosts();
  const related = allPosts
    .filter((p) => p.slug !== post.slug && p.category === post.category)
    .slice(0, 3);

  return (
    <PublicShell>
      <ArticleJsonLd post={post} />
      <BreadcrumbJsonLd post={post} />
      <article style={{ padding: "128px 24px 96px", maxWidth: 760, margin: "0 auto" }}>
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5"
          style={{ color: "var(--hs-ink-tertiary)", fontSize: 13, marginBottom: 24 }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> All posts
        </Link>
        <SectionEyebrow>
          {post.category} · {post.readingTime} min read
        </SectionEyebrow>
        <h1
          className="font-display"
          style={{
            fontSize: "clamp(32px,4.5vw,52px)",
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "var(--hs-ink)",
            margin: "16px 0 16px",
          }}
        >
          {post.title}
        </h1>
        <p style={{ fontSize: 18, color: "var(--hs-ink-secondary)", lineHeight: 1.65, marginBottom: 28 }}>
          {post.excerpt}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            fontSize: 13.5,
            color: "var(--hs-ink-tertiary)",
            paddingBottom: 28,
            marginBottom: 40,
            borderBottom: "1px solid var(--hs-border-subtle)",
          }}
        >
          <span>
            By <span style={{ color: "var(--hs-ink)" }}>{post.author}</span>
          </span>
          <span aria-hidden>·</span>
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </div>
        <div
          className="hs-prose"
          style={{ fontSize: 16.5, lineHeight: 1.75, color: "var(--hs-ink-secondary)" }}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--hs-border-subtle)", display: "flex", flexWrap: "wrap", gap: 8 }}>
          {post.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 12,
                padding: "5px 10px",
                borderRadius: 9999,
                background: "var(--hs-mist)",
                color: "var(--hs-ink-secondary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
        <aside
          className="glass-card"
          style={{
            marginTop: 56,
            padding: 32,
          }}
        >
          <h2
            className="font-display"
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "var(--hs-ink)",
              letterSpacing: "-0.015em",
              marginBottom: 10,
            }}
          >
            Close the AI Compliance Gap
          </h2>
          <p style={{ color: "var(--hs-ink-secondary)", marginBottom: 20, fontSize: 14.5, lineHeight: 1.65 }}>
            HoundShield intercepts AI prompts before they leave your network. One URL change, sub-10ms scanning, PDF evidence for your C3PAO assessor. Setup takes under 10 minutes.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/demo"
              className="text-white inline-flex items-center gap-1.5"
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 14,
                background: "linear-gradient(135deg, var(--hs-steel-dark), var(--hs-steel))",
                boxShadow: "0 4px 12px rgba(90,134,168,0.25)",
              }}
            >
              See the Demo →
            </Link>
            <Link
              href="/pricing"
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 14,
                color: "var(--hs-ink)",
                background: "var(--hs-mist)",
                border: "1px solid var(--hs-border)",
              }}
            >
              View Pricing
            </Link>
          </div>
        </aside>
        {related.length > 0 && (
          <section style={{ marginTop: 56 }}>
            <SectionEyebrow>Related articles</SectionEyebrow>
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              {related.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className="glass-card" style={{ padding: 18, display: "block" }}>
                  <div className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: "0.14em", color: "var(--hs-ink-tertiary)", marginBottom: 6 }}>
                    {p.readingTime} min read
                  </div>
                  <h3 className="font-display" style={{ fontSize: 15.5, fontWeight: 600, color: "var(--hs-ink)", lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                    {p.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
      <style>{`
        .hs-prose h2 { font-family: var(--font-display); font-size: 28px; font-weight: 600; color: var(--hs-ink); margin: 40px 0 16px; letter-spacing: -0.015em; line-height: 1.2; }
        .hs-prose h3 { font-family: var(--font-display); font-size: 22px; font-weight: 600; color: var(--hs-ink); margin: 32px 0 12px; letter-spacing: -0.01em; line-height: 1.25; }
        .hs-prose p { margin: 0 0 16px; }
        .hs-prose ul, .hs-prose ol { margin: 0 0 16px 22px; padding: 0; }
        .hs-prose li { margin-bottom: 8px; }
        .hs-prose a { color: var(--hs-steel-dark); text-decoration: underline; text-decoration-color: var(--hs-border); text-underline-offset: 3px; }
        .hs-prose a:hover { text-decoration-color: var(--hs-steel-dark); }
        .hs-prose code { background: var(--hs-mist-md); padding: 2px 6px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.92em; color: var(--hs-ink); }
        .hs-prose pre { background: #0F1E2E; color: #C5DAE9; padding: 18px; border-radius: 12px; overflow-x: auto; font-family: var(--font-mono); font-size: 13px; line-height: 1.65; margin: 16px 0; }
        .hs-prose blockquote { border-left: 3px solid var(--hs-steel); padding: 4px 18px; margin: 18px 0; color: var(--hs-ink-secondary); font-style: italic; }
        .hs-prose strong { color: var(--hs-ink); font-weight: 600; }
        .hs-prose table { border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 14px; }
        .hs-prose th, .hs-prose td { padding: 8px 10px; border: 1px solid var(--hs-border-subtle); }
        .hs-prose th { background: var(--hs-mist); color: var(--hs-ink); font-weight: 600; text-align: left; }
      `}</style>
    </PublicShell>
  );
}
