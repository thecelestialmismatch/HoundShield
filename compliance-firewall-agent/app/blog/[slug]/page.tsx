import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Clock, Calendar, Tag, ArrowRight, AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { BLOG_POSTS, getPost, type BlogSection } from "../posts/data";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Not Found" };
  return {
    title: `${post.title} — HoundShield Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
    },
  };
}

function CalloutBox({ section }: { section: BlogSection }) {
  const variants = {
    warning: {
      bg: "bg-amber-500/[0.08]",
      border: "border-amber-500/30",
      icon: AlertTriangle,
      iconColor: "text-amber-400",
      textColor: "text-amber-100",
    },
    danger: {
      bg: "bg-red-500/[0.08]",
      border: "border-red-500/30",
      icon: XCircle,
      iconColor: "text-red-400",
      textColor: "text-red-100",
    },
    info: {
      bg: "bg-brand-400/[0.06]",
      border: "border-brand-400/30",
      icon: Info,
      iconColor: "text-brand-400",
      textColor: "text-slate-200",
    },
    success: {
      bg: "bg-emerald-500/[0.08]",
      border: "border-emerald-500/30",
      icon: CheckCircle,
      iconColor: "text-emerald-400",
      textColor: "text-emerald-100",
    },
  };
  const v = variants[section.variant ?? "info"];
  const Icon = v.icon;
  return (
    <div className={`my-6 flex gap-4 rounded-xl border p-5 ${v.bg} ${v.border}`}>
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${v.iconColor}`} />
      <p className={`text-sm leading-relaxed ${v.textColor}`}>{section.text}</p>
    </div>
  );
}

function CodeBlock({ section }: { section: BlogSection }) {
  return (
    <div className="my-6 rounded-xl border border-white/[0.1] bg-[#0d0d14] overflow-hidden">
      {section.language && (
        <div className="px-4 py-2 border-b border-white/[0.06] flex items-center justify-between">
          <span className="text-xs font-mono text-slate-500">{section.language}</span>
        </div>
      )}
      <pre className="p-5 text-sm font-mono text-slate-300 overflow-x-auto leading-relaxed whitespace-pre">
        {section.text}
      </pre>
    </div>
  );
}

function DataTable({ section }: { section: BlogSection }) {
  return (
    <div className="my-6 overflow-x-auto rounded-xl border border-white/[0.1]">
      <table className="w-full text-sm">
        {section.headers && (
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.03]">
              {section.headers.map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {section.rows?.map((row, ri) => (
            <tr key={ri} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
              {row.map((cell, ci) => (
                <td key={ci} className={`px-4 py-3 ${ci === 0 ? "font-semibold text-white" : "text-slate-400"} ${cell === "No" ? "text-red-400 font-semibold" : ""} ${cell === "Yes" ? "text-emerald-400 font-semibold" : ""}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RenderSection({ section }: { section: BlogSection }) {
  switch (section.type) {
    case "h2":
      return <h2 className="text-2xl sm:text-3xl font-bold text-white mt-12 mb-4 leading-tight">{section.text}</h2>;
    case "h3":
      return <h3 className="text-xl font-semibold text-white mt-8 mb-3">{section.text}</h3>;
    case "p":
      return <p className="text-slate-300 leading-relaxed my-4">{section.text}</p>;
    case "callout":
      return <CalloutBox section={section} />;
    case "code":
      return <CodeBlock section={section} />;
    case "list":
      return (
        <ul className="my-4 flex flex-col gap-2.5">
          {section.items?.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-slate-300 text-sm leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0 mt-2" />
              {item}
            </li>
          ))}
        </ul>
      );
    case "table":
      return <DataTable section={section} />;
    default:
      return null;
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <div className="bg-[#07070b] min-h-screen">
      <Navbar variant="dark" />

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        {/* Back */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 mb-10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to blog
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-400/10 text-brand-400 text-xs font-semibold">
            <Tag className="w-3 h-3" />
            {post.category}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <Calendar className="w-3 h-3" />
            {post.publishedAt}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <Clock className="w-3 h-3" />
            {post.readingTimeMin} min read
          </span>
        </div>

        {/* Title */}
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-white leading-[1.1] mb-4">
          {post.title}
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed mb-3">{post.subtitle}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-10">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-xs text-slate-400 font-mono"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="border-t border-white/[0.08] mb-10" />

        {/* Content */}
        <article>
          {post.content.map((section, i) => (
            <RenderSection key={i} section={section} />
          ))}
        </article>

        <div className="border-t border-white/[0.08] mt-14 pt-10">
          <div className="rounded-2xl border border-brand-400/20 bg-brand-400/[0.04] p-8">
            <p className="text-xs font-mono font-semibold text-brand-400 uppercase tracking-[0.2em] mb-3">
              Ready to fix your data boundary?
            </p>
            <h3 className="text-2xl font-bold text-white mb-3">
              Deploy HoundShield in 15 minutes.
            </h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Local-only AI proxy. No cloud DLP. No DFARS incidents. Free for up to 5 users — C3PAO-ready PDF on day one.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                Deploy Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/docs/quickstart"
                className="inline-flex items-center justify-center gap-2 text-brand-400 hover:text-brand-300 font-medium text-sm transition-colors"
              >
                View quickstart guide <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
