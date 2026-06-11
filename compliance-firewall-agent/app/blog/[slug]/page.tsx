import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
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
    <>
      <ArticleJsonLd post={post} />
      <BreadcrumbJsonLd post={post} />
      <main className="min-h-screen bg-[var(--hs-surface-0)] text-[var(--hs-ink)]">
        {/* Nav */}
        <header className="border-b border-[var(--hs-border)] bg-[var(--hs-surface-0)]/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/blog" className="text-sm text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)] transition-colors">
              ← Blog
            </Link>
            <Link href="/" className="text-sm text-[var(--hs-ink-tertiary)] hover:text-[var(--hs-ink)] transition-colors">
              houndshield.com
            </Link>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[var(--hs-ink-tertiary)] mb-8">
            <Link href="/" className="hover:text-[var(--hs-ink)]/60 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-[var(--hs-ink)]/60 transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-[var(--hs-ink-tertiary)] truncate max-w-xs">{post.title}</span>
          </nav>

          {/* Article header */}
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full border bg-[var(--hs-mist)] text-[var(--hs-steel-dark)] border-[var(--hs-border)]">
                {post.category}
              </span>
              <span className="text-xs text-[var(--hs-ink-tertiary)]">{post.readingTime} min read</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-6">{post.title}</h1>
            <p className="text-lg text-[var(--hs-ink-secondary)] leading-relaxed mb-8">{post.excerpt}</p>
            <div className="flex items-center gap-4 text-sm text-[var(--hs-ink-tertiary)] pb-8 border-b border-[var(--hs-border)]">
              <span>
                By <span className="text-[var(--hs-ink-secondary)]">{post.author}</span>
              </span>
              <span>·</span>
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </div>
          </header>

          {/* Article body */}
          <article
            className="prose prose-invert prose-blue max-w-none
              prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-4
              prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8
              prose-p:text-[var(--hs-ink-secondary)] prose-p:leading-relaxed
              prose-li:text-[var(--hs-ink-secondary)] prose-li:leading-relaxed
              prose-strong:text-[var(--hs-ink)] prose-strong:font-semibold
              prose-a:text-[var(--hs-steel-dark)] prose-a:no-underline hover:prose-a:underline
              prose-table:text-sm prose-th:text-[var(--hs-ink)] prose-td:text-[var(--hs-ink-secondary)]
              prose-blockquote:border-[var(--hs-steel)] prose-blockquote:text-[var(--hs-ink-secondary)]"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          <div className="mt-12 pt-8 border-t border-[var(--hs-border)]">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 bg-white border border-[var(--hs-border)] rounded-full text-[var(--hs-ink-tertiary)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <aside className="mt-16 p-8 bg-gradient-to-br from-[var(--hs-mist)] to-white border border-[var(--hs-border)] rounded-2xl">
            <h2 className="text-xl font-bold mb-3">Close the AI Compliance Gap</h2>
            <p className="text-[var(--hs-ink-secondary)] mb-6 text-sm leading-relaxed">
              HoundShield intercepts AI prompts before they leave your network. One URL change,
              sub-10ms scanning, PDF evidence for your C3PAO assessor. Setup takes under 10 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/demo"
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-colors text-center"
              >
                See the Demo →
              </Link>
              <Link
                href="/pricing"
                className="px-5 py-2.5 bg-[var(--hs-mist)] hover:bg-[var(--hs-mist)] text-[var(--hs-ink)] text-sm font-semibold rounded-xl transition-colors text-center"
              >
                View Pricing
              </Link>
            </div>
          </aside>

          {/* Related posts */}
          {related.length > 0 && (
            <section className="mt-16">
              <h2 className="text-lg font-bold mb-6 text-[var(--hs-ink-secondary)]">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {related.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="block p-5 bg-white border border-[var(--hs-border)] rounded-xl hover:border-[var(--hs-border-strong)] hover:bg-white transition-all"
                  >
                    <p className="text-xs text-[var(--hs-ink-tertiary)] mb-2">{p.readingTime} min read</p>
                    <h3 className="text-sm font-semibold text-[var(--hs-ink)] leading-snug">{p.title}</h3>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
