import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import { getAllPosts } from "@/lib/blog/posts";

export const metadata: Metadata = {
  title: "Blog — CMMC, HIPAA, and AI compliance",
  description: "Engineering and compliance insights from the HoundShield team. CMMC Level 2, HIPAA, NIST 800-171, AI security.",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <PublicShell>
      <section className="spotlight" style={{ position: "relative", padding: "128px 24px 48px", overflow: "hidden" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <SectionEyebrow>Blog</SectionEyebrow>
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(36px,5vw,56px)",
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--hs-ink)",
              margin: "16px 0 24px",
            }}
          >
            Compliance signal from the engineering team.
          </h1>
          <p style={{ fontSize: 17, color: "var(--hs-ink-secondary)", maxWidth: 640 }}>
            CMMC L2 prep, NIST 800-171 control mapping, HIPAA AI gotchas, and the detection patterns we ship.
          </p>
        </div>
      </section>

      <section className="spotlight" style={{ position: "relative", padding: "48px 24px 96px", overflow: "hidden" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            {posts.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="glass-card"
                style={{ padding: 28, display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div
                  className="font-mono uppercase"
                  style={{ fontSize: 10, letterSpacing: "0.14em", color: "var(--hs-steel-dark)" }}
                >
                  {p.category} · {p.readingTime} min read
                </div>
                <h2
                  className="font-display"
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    color: "var(--hs-ink)",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                  }}
                >
                  {p.title}
                </h2>
                <p style={{ fontSize: 14, color: "var(--hs-ink-secondary)", lineHeight: 1.6, flex: 1 }}>{p.excerpt}</p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: 12,
                    borderTop: "1px solid var(--hs-border-subtle)",
                    fontSize: 12,
                    color: "var(--hs-ink-tertiary)",
                  }}
                >
                  <span>{new Date(p.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
                  <span style={{ color: "var(--hs-steel-dark)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    Read <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
