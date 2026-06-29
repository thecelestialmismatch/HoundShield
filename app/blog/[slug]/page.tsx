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
      <main className="min-h-screen bg-[#07070b] text-white">
        {/* Nav */}
        <header className="border-b border-white/10 bg-[#07070b]/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/blog" className="text-sm text-white/60 hover:text-white transition-colors">
              ← Blog
            </Link>
            <Link href="/" className="text-sm text-white/40 hover:text-white transition-colors">
              houndshield.com
            </Link>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/30 mb-8">
            <Link href="/" className="hover:text-white/60 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-white/60 transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-white/50 truncate max-w-xs">{post.title}</span>
          </nav>

          {/* Article header */}
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full border bg-blue-900/40 text-blue-300 border-blue-800">
                {post.category}
              </span>
              <span className="text-xs text-white/40">{post.readingTime} min read</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-6">{post.title}</h1>
            <p className="text-lg text-white/60 leading-relaxed mb-8">{post.excerpt}</p>
            <div className="flex items-center gap-4 text-sm text-white/40 pb-8 border-b border-white/10">
              <span>
                By <span className="text-white/70">{post.author}</span>
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
              prose-p:text-white/70 prose-p:leading-relaxed
              prose-li:text-white/70 prose-li:leading-relaxed
              prose-strong:text-white prose-strong:font-semibold
              prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
              prose-table:text-sm prose-th:text-white prose-td:text-white/70
              prose-blockquote:border-blue-500 prose-blockquote:text-white/60"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 bg-white/[0.05] border border-white/10 rounded-full text-white/50"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <aside className="mt-16 p-8 bg-gradient-to-br from-blue-950/40 to-slate-900/40 border border-blue-500/20 rounded-2xl">
            <h2 className="text-xl font-bold mb-3">Close the AI Compliance Gap</h2>
            <p className="text-white/60 mb-6 text-sm leading-relaxed">
              HoundShield intercepts AI prompts before they leave your network. One URL change,
              sub-10ms scanning, PDF evidence for your C3PAO assessor. Setup takes under 10 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/demo"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors text-center"
              >
                See the Demo →
              </Link>
              <Link
                href="/pricing"
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-colors text-center"
              >
                View Pricing
              </Link>
            </div>
          </aside>

          {/* Related posts */}
          {related.length > 0 && (
            <section className="mt-16">
              <h2 className="text-lg font-bold mb-6 text-white/80">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {related.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="block p-5 bg-white/[0.03] border border-white/10 rounded-xl hover:border-blue-500/30 hover:bg-white/[0.05] transition-all"
                  >
                    <p className="text-xs text-white/40 mb-2">{p.readingTime} min read</p>
                    <h3 className="text-sm font-semibold text-white/90 leading-snug">{p.title}</h3>
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
