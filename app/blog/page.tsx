import type { Metadata } from "next";
import Link from "next/link";
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
  "CMMC Compliance": "bg-blue-900/40 text-blue-300 border-blue-800",
  "HIPAA Compliance": "bg-emerald-900/40 text-emerald-300 border-emerald-800",
  "AI Security": "bg-amber-900/40 text-amber-300 border-amber-800",
  "SOC 2": "bg-purple-900/40 text-purple-300 border-purple-800",
  "How-To": "bg-slate-800 text-slate-300 border-slate-700",
  "Industry News": "bg-rose-900/40 text-rose-300 border-rose-800",
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
    <article className="group relative flex flex-col bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-blue-500/40 hover:bg-white/[0.05] transition-all duration-200">
      <div className="flex items-center gap-3 mb-4">
        <CategoryBadge category={post.category} />
        <span className="text-xs text-white/40">{post.readingTime} min read</span>
      </div>
      <h2 className="text-lg font-semibold text-white leading-snug mb-3 group-hover:text-blue-400 transition-colors">
        <Link href={`/blog/${post.slug}`} className="stretched-link">
          {post.title}
        </Link>
      </h2>
      <p className="text-sm text-white/60 leading-relaxed flex-1 mb-4">{post.excerpt}</p>
      <div className="flex items-center justify-between text-xs text-white/40 mt-auto pt-4 border-t border-white/5">
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
      <main className="min-h-screen bg-[#07070b] text-white">
        {/* Header */}
        <header className="border-b border-white/10 bg-[#07070b]/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors">
              ← houndshield.com
            </Link>
            <span className="text-xs text-white/30">Compliance Intelligence</span>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 py-16">
          {/* Hero */}
          <div className="mb-16 max-w-3xl">
            <p className="text-xs font-mono text-blue-400 uppercase tracking-widest mb-4">
              CMMC &amp; AI Security Blog
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Stay Ahead of CMMC.
              <br />
              <span className="text-white/40">Don&apos;t Lose Your Contracts.</span>
            </h1>
            <p className="text-lg text-white/60 leading-relaxed">
              Expert guides on CMMC Level 2, protecting CUI from AI tools, HIPAA compliance,
              and everything a defense contractor&apos;s IT security manager needs to know in 2026.
            </p>
          </div>

          {/* Featured post */}
          {featured && (
            <section className="mb-16">
              <p className="text-xs font-mono text-white/30 uppercase tracking-widest mb-6">
                Featured
              </p>
              <article className="group relative bg-gradient-to-br from-blue-950/40 to-slate-900/40 border border-blue-500/20 rounded-2xl p-8 hover:border-blue-500/40 transition-all duration-200">
                <div className="flex items-center gap-3 mb-5">
                  <CategoryBadge category={featured.category} />
                  <span className="text-xs text-white/40">{featured.readingTime} min read</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug mb-4 group-hover:text-blue-400 transition-colors max-w-2xl">
                  <Link href={`/blog/${featured.slug}`}>{featured.title}</Link>
                </h2>
                <p className="text-base text-white/60 leading-relaxed max-w-2xl mb-6">
                  {featured.excerpt}
                </p>
                <div className="flex items-center justify-between text-sm text-white/40">
                  <span>{featured.author}</span>
                  <Link
                    href={`/blog/${featured.slug}`}
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    Read article →
                  </Link>
                </div>
              </article>
            </section>
          )}

          {/* All posts grid */}
          <section>
            <p className="text-xs font-mono text-white/30 uppercase tracking-widest mb-6">
              All Articles
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          </section>

          {/* CTA */}
          <aside className="mt-24 text-center py-16 px-8 bg-white/[0.03] border border-white/10 rounded-2xl">
            <h2 className="text-2xl font-bold mb-4">
              Ready to Pass Your CMMC Assessment?
            </h2>
            <p className="text-white/60 mb-8 max-w-xl mx-auto">
              One URL change. Sub-10ms AI scanning. PDF evidence your C3PAO can review on-site.
              Defense contractors use HoundShield to close the AI compliance gap before their audit.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/demo"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
              >
                See the Demo
              </Link>
              <Link
                href="/pricing"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
