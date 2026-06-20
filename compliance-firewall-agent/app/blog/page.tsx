import type { Metadata } from "next";
import Link from "next/link";
import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import { getAllPosts, type BlogPost, type BlogCategory } from "@/lib/blog/posts";

// ── SEO metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "CMMC Compliance Blog | HoundShield",
  description:
    "Expert guides on CMMC Level 2, AI security for defense contractors, HIPAA compliance, and protecting CUI. Written by compliance engineers for ISSOs and IT security managers.",
  keywords: [
    "CMMC compliance blog",
    "CMMC Level 2 guide",
    "defense contractor AI security",
    "CUI protection",
    "NIST 800-171",
    "HIPAA compliance guide",
    "AI DLP",
    "C3PAO preparation",
  ],
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com"}/blog`,
  },
  openGraph: {
    title: "CMMC Compliance Blog | HoundShield",
    description:
      "Expert guides on CMMC Level 2, AI security, and CUI protection for defense contractors.",
    type: "website",
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com"}/blog`,
  },
};

// ── JSON-LD ───────────────────────────────────────────────────────────────────
function BlogJsonLd({ posts }: { posts: BlogPost[] }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://houndshield.com";
  const schema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "HoundShield CMMC Compliance Blog",
    description:
      "Expert guides on CMMC Level 2, AI security for defense contractors, and protecting Controlled Unclassified Information.",
    url: `${baseUrl}/blog`,
    publisher: {
      "@type": "Organization",
      name: "HoundShield",
      url: baseUrl,
      logo: { "@type": "ImageObject", url: `${baseUrl}/logo.png` },
    },
    blogPost: posts.slice(0, 10).map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description,
      url: `${baseUrl}/blog/${p.slug}`,
      datePublished: p.date,
      author: { "@type": "Organization", name: p.author },
      keywords: p.tags.join(", "),
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ── Category badge ────────────────────────────────────────────────────────────
const categoryColors: Record<BlogCategory, string> = {
  "CMMC Compliance": "bg-[var(--hs-mist)] text-[var(--hs-steel-dark)] border-[var(--hs-border)]",
  "HIPAA Compliance": "bg-[rgba(5,150,105,0.08)] text-[var(--hs-success)] border-[rgba(5,150,105,0.25)]",
  "AI Security": "bg-brand-50 text-brand-700 border-brand-200",
  "SOC 2": "bg-[rgba(129,166,198,0.12)] text-[var(--hs-steel-dark)] border-[rgba(129,166,198,0.35)]",
  "How-To": "bg-[var(--hs-surface-1)] text-[var(--hs-ink-secondary)] border-[var(--hs-border)]",
  "Industry News": "bg-rose-50 text-rose-600 border-rose-200",
};

function CategoryBadge({ category }: { category: BlogCategory }) {
  return (
    <span
      className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${categoryColors[category]}`}
    >
      {category}
    </span>
  );
}

// ── Post card ─────────────────────────────────────────────────────────────────
function PostCard({ post }: { post: BlogPost }) {
  return (
    <article className="group relative flex flex-col bg-white border border-[var(--hs-border)] rounded-2xl p-6 hover:border-[var(--hs-border-strong)] hover:bg-white transition-all duration-200">
      <div className="flex items-center gap-3 mb-4">
        <CategoryBadge category={post.category} />
        <span className="text-xs text-[var(--hs-ink-tertiary)]">{post.readingTime} min read</span>
      </div>
      <h2 className="text-lg font-semibold text-[var(--hs-ink)] leading-snug mb-3 group-hover:text-[var(--hs-steel-dark)] transition-colors">
        <Link href={`/blog/${post.slug}`} className="stretched-link">
          {post.title}
        </Link>
      </h2>
      <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed flex-1 mb-4">{post.excerpt}</p>
      <div className="flex items-center justify-between text-xs text-[var(--hs-ink-tertiary)] mt-auto pt-4 border-t border-[var(--hs-border-subtle)]">
        <span>{post.author}</span>
        <time dateTime={post.date}>
          {new Date(post.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
      </div>
    </article>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function BlogPage() {
  const posts = getAllPosts();
  const featured = posts.find((p) => p.featured);
  const rest = posts.filter((p) => !p.featured);

  return (
    <>
      <BlogJsonLd posts={posts} />
      <main className="min-h-screen bg-[var(--hs-surface-0)] text-[var(--hs-ink)]">
        <NavV3 />

        <div className="max-w-[1200px] mx-auto px-6 pt-32 pb-16">
          {/* Hero */}
          <div className="mb-16 max-w-3xl">
            <p className="text-xs font-mono text-[var(--hs-steel-dark)] uppercase tracking-widest mb-4">
              CMMC &amp; AI Security Blog
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Stay Ahead of CMMC.
              <br />
              <span className="text-[var(--hs-ink-tertiary)]">Don&apos;t Lose Your Contracts.</span>
            </h1>
            <p className="text-lg text-[var(--hs-ink-secondary)] leading-relaxed">
              Expert guides on CMMC Level 2, protecting CUI from AI tools, HIPAA compliance,
              and everything a defense contractor&apos;s IT security manager needs to know in 2026.
            </p>
          </div>

          {/* Featured post */}
          {featured && (
            <section className="mb-16">
              <p className="text-xs font-mono text-[var(--hs-ink-tertiary)] uppercase tracking-widest mb-6">
                Featured
              </p>
              <article className="group relative bg-gradient-to-br from-[var(--hs-mist)] to-white border border-[var(--hs-border)] rounded-2xl p-8 hover:border-[var(--hs-border-strong)] transition-all duration-200">
                <div className="flex items-center gap-3 mb-5">
                  <CategoryBadge category={featured.category} />
                  <span className="text-xs text-[var(--hs-ink-tertiary)]">{featured.readingTime} min read</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-[var(--hs-ink)] leading-snug mb-4 group-hover:text-[var(--hs-steel-dark)] transition-colors max-w-2xl">
                  <Link href={`/blog/${featured.slug}`}>{featured.title}</Link>
                </h2>
                <p className="text-base text-[var(--hs-ink-secondary)] leading-relaxed max-w-2xl mb-6">
                  {featured.excerpt}
                </p>
                <div className="flex items-center justify-between text-sm text-[var(--hs-ink-tertiary)]">
                  <span>{featured.author}</span>
                  <Link
                    href={`/blog/${featured.slug}`}
                    className="text-[var(--hs-steel-dark)] hover:text-[var(--hs-steel)] font-medium transition-colors"
                  >
                    Read article →
                  </Link>
                </div>
              </article>
            </section>
          )}

          {/* All posts grid */}
          <section>
            <p className="text-xs font-mono text-[var(--hs-ink-tertiary)] uppercase tracking-widest mb-6">
              All Articles
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          </section>

          {/* CTA */}
          <aside className="mt-24 text-center py-16 px-8 bg-white border border-[var(--hs-border)] rounded-2xl">
            <h2 className="text-2xl font-bold mb-4">
              Ready to Pass Your CMMC Assessment?
            </h2>
            <p className="text-[var(--hs-ink-secondary)] mb-8 max-w-xl mx-auto">
              One URL change. Sub-10ms AI scanning. PDF evidence your C3PAO can review on-site.
              Defense contractors use HoundShield to close the AI compliance gap before their audit.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/demo"
                className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors"
              >
                See the Demo
              </Link>
              <Link
                href="/pricing"
                className="px-6 py-3 bg-[var(--hs-mist)] hover:bg-[var(--hs-mist)] text-[var(--hs-ink)] font-semibold rounded-xl transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </aside>
        </div>

        <FooterV3 />
      </main>
    </>
  );
}
