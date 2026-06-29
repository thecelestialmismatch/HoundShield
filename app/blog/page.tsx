import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NavV3 } from "@/components/layout/NavV3";
import { FooterV3 } from "@/components/layout/FooterV3";
import { getAllPosts, type BlogPost, type BlogCategory } from "@/lib/blog/posts";
import { BRAND } from "@/lib/site-config";

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
  alternates: { canonical: `${BRAND.url}/blog` },
  openGraph: {
    title: "CMMC Compliance Blog | HoundShield",
    description:
      "Expert guides on CMMC Level 2, AI security, and CUI protection for defense contractors.",
    type: "website",
    url: `${BRAND.url}/blog`,
  },
};

// ── JSON-LD ───────────────────────────────────────────────────────────────────
function BlogJsonLd({ posts }: { posts: BlogPost[] }) {
  const baseUrl = BRAND.url;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "HoundShield CMMC Compliance Blog",
    description:
      "Expert guides on CMMC Level 2, AI security for defense contractors, and protecting Controlled Unclassified Information.",
    url: `${baseUrl}/blog`,
    publisher: {
      "@type": "Organization",
      name: BRAND.name,
      url: baseUrl,
      logo: { "@type": "ImageObject", url: `${baseUrl}${BRAND.logo}` },
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
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

// ── Category badge (light theme) ──────────────────────────────────────────────
const categoryColors: Record<BlogCategory, string> = {
  "CMMC Compliance": "bg-[var(--hs-mist-md)] text-[var(--hs-steel-dark)] border-[var(--hs-border)]",
  "HIPAA Compliance": "bg-[var(--hs-success-bg)] text-[var(--hs-success)] border-[var(--hs-border)]",
  "AI Security": "bg-[var(--hs-mist)] text-[var(--hs-steel-dark)] border-[var(--hs-border)]",
  "SOC 2": "bg-[var(--hs-mist-md)] text-[var(--hs-steel-dark)] border-[var(--hs-border)]",
  "How-To": "bg-[var(--hs-surface-2)] text-[var(--hs-ink-secondary)] border-[var(--hs-border)]",
  "Industry News": "bg-[var(--hs-warn-bg)] text-[var(--hs-warn)] border-[var(--hs-border)]",
};

function CategoryBadge({ category }: { category: BlogCategory }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border font-[var(--font-body)] ${categoryColors[category]}`}>
      {category}
    </span>
  );
}

// ── Post card ─────────────────────────────────────────────────────────────────
function PostCard({ post }: { post: BlogPost }) {
  return (
    <article className="group relative flex flex-col glass-card p-6 hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center gap-3 mb-4">
        <CategoryBadge category={post.category} />
        <span className="text-xs text-[var(--hs-ink-tertiary)]">{post.readingTime} min read</span>
      </div>
      <h2 className="text-lg font-semibold text-[var(--hs-ink)] leading-snug mb-3 group-hover:text-[var(--hs-steel-dark)] transition-colors font-[var(--font-body)]">
        <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
          {post.title}
        </Link>
      </h2>
      <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed flex-1 mb-4 font-[var(--font-body)]">{post.excerpt}</p>
      <div className="flex items-center justify-between text-xs text-[var(--hs-ink-tertiary)] mt-auto pt-4 border-t border-[var(--hs-border-subtle)]">
        <span>{post.author}</span>
        <time dateTime={post.date}>
          {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
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
    <div className="min-h-screen bg-[var(--hs-surface-0)]">
      <BlogJsonLd posts={posts} />
      <NavV3 />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {/* Hero */}
        <div className="mb-14 max-w-3xl">
          <p className="text-xs font-semibold tracking-widest text-[var(--hs-steel-dark)] uppercase mb-4 font-[var(--font-body)]">
            CMMC &amp; AI Security Blog
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[var(--hs-ink)] mb-6" style={{ fontFamily: "var(--font-display)" }}>
            Stay ahead of CMMC.
            <br />
            <span className="text-[var(--hs-ink-tertiary)]">Don&apos;t lose your contracts.</span>
          </h1>
          <p className="text-lg text-[var(--hs-ink-secondary)] leading-relaxed font-[var(--font-body)]">
            Expert guides on CMMC Level 2, protecting CUI from AI tools, HIPAA compliance, and what a
            defense contractor&apos;s IT security manager needs to know in 2026.
          </p>
        </div>

        {/* Featured */}
        {featured && (
          <section className="mb-16">
            <p className="text-xs font-semibold text-[var(--hs-ink-tertiary)] uppercase tracking-widest mb-6 font-[var(--font-mono)]">Featured</p>
            <article className="group relative glass-card p-8 hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center gap-3 mb-5">
                <CategoryBadge category={featured.category} />
                <span className="text-xs text-[var(--hs-ink-tertiary)]">{featured.readingTime} min read</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold text-[var(--hs-ink)] leading-snug mb-4 group-hover:text-[var(--hs-steel-dark)] transition-colors max-w-2xl" style={{ fontFamily: "var(--font-display)" }}>
                <Link href={`/blog/${featured.slug}`} className="after:absolute after:inset-0">{featured.title}</Link>
              </h2>
              <p className="text-base text-[var(--hs-ink-secondary)] leading-relaxed max-w-2xl mb-6 font-[var(--font-body)]">{featured.excerpt}</p>
              <span className="inline-flex items-center gap-1.5 text-sm text-[var(--hs-steel-dark)] font-semibold font-[var(--font-body)]">
                Read article <ArrowRight className="w-4 h-4" />
              </span>
            </article>
          </section>
        )}

        {/* All posts */}
        <section>
          <p className="text-xs font-semibold text-[var(--hs-ink-tertiary)] uppercase tracking-widest mb-6 font-[var(--font-mono)]">All articles</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>

        {/* CTA */}
        <aside className="mt-20 text-center py-14 px-8 rounded-[var(--radius-xl)] bg-[var(--hs-navy)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--hs-steel-dark)]/10 to-transparent" />
          <div className="relative">
            <h2 className="text-2xl font-semibold text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>Ready to pass your CMMC assessment?</h2>
            <p className="text-[var(--hs-sky)] mb-8 max-w-xl mx-auto font-[var(--font-body)]">
              One URL change. Sub-10ms AI scanning. PDF evidence your C3PAO can review on-site.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/how-it-works" className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-[var(--hs-navy)] bg-white rounded-[var(--radius-md)] hover:bg-[var(--hs-cream)] transition-colors font-[var(--font-body)]">
                See how it works
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white border border-white/20 rounded-[var(--radius-md)] hover:bg-white/10 transition-colors font-[var(--font-body)]">
                View pricing
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <FooterV3 />
    </div>
  );
}
