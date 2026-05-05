import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Clock, Tag } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { BLOG_POSTS } from "./posts/data";

export const metadata: Metadata = {
  title: "HoundShield Blog — CMMC, AI Security, and DFARS Compliance",
  description:
    "Technical deep-dives on CMMC Level 2 compliance, AI data exfiltration risk, and how the Defense Industrial Base can use AI safely without violating DFARS 252.204-7012.",
  openGraph: {
    title: "HoundShield Blog — CMMC, AI Security, and DFARS Compliance",
    description:
      "Technical deep-dives on CMMC Level 2 compliance, AI data exfiltration risk, and how the Defense Industrial Base can use AI safely.",
    type: "website",
  },
};

export default function BlogIndexPage() {
  return (
    <div className="bg-[#07070b] min-h-screen">
      <Navbar variant="dark" />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        {/* Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-400/20 bg-brand-400/[0.06] text-brand-400 text-xs font-semibold uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            HoundShield Research
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4 leading-[1.1]">
            The Blog
          </h1>
          <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
            CMMC compliance, AI security architecture, and DFARS data-flow analysis for the Defense Industrial Base.
          </p>
        </div>

        {/* Posts */}
        <div className="flex flex-col gap-6">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block p-7 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:border-brand-400/30 hover:bg-brand-400/[0.04] transition-all duration-300"
            >
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-400/10 text-brand-400 text-xs font-semibold">
                  <Tag className="w-3 h-3" />
                  {post.category}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                  <Clock className="w-3 h-3" />
                  {post.readingTimeMin} min read
                </span>
                <span className="text-xs text-slate-600 font-mono">{post.publishedAt}</span>
              </div>

              <h2 className="text-xl font-bold text-white group-hover:text-brand-300 transition-colors mb-3 leading-snug">
                {post.title}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-5 line-clamp-3">
                {post.excerpt}
              </p>

              <div className="flex flex-wrap gap-2 mb-5">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-xs text-slate-400 font-mono"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-400 group-hover:gap-2.5 transition-all">
                Read post <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
