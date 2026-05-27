import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Book, Terminal, Shield, Zap, FileCheck, Code } from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";

export const metadata: Metadata = {
  title: "Documentation",
  description: "HoundShield deployment guides, API reference, detection patterns, compliance mapping.",
};

const SECTIONS = [
  { icon: <Zap className="w-5 h-5" />, title: "Quickstart", body: "Deploy HoundShield in 10 minutes — Docker, environment vars, first scan, first audit PDF.", href: "/docs/quickstart" },
  { icon: <Terminal className="w-5 h-5" />, title: "Proxy Configuration", body: "OpenAI-compatible endpoint, Claude/Gemini routing, header forwarding, streaming responses.", href: "/docs/quickstart" },
  { icon: <Shield className="w-5 h-5" />, title: "Detection Patterns", body: "All 16 built-in patterns. Custom detection rules. Pattern priority and chaining.", href: "/docs/quickstart" },
  { icon: <FileCheck className="w-5 h-5" />, title: "Audit & Compliance", body: "SHA-256 hash chain, NIST 800-171 control mapping, C3PAO PDF generation, HIPAA reports.", href: "/docs/quickstart" },
  { icon: <Code className="w-5 h-5" />, title: "API Reference", body: "REST endpoints, webhook payloads, license validation, on-prem deployment.", href: "/docs/quickstart" },
  { icon: <Book className="w-5 h-5" />, title: "Concepts", body: "Local-only architecture, OODA behavioral engine, Brain AI compliance advisor.", href: "/docs/quickstart" },
];

export default function DocsPage() {
  return (
    <PublicShell>
      <section className="spotlight" style={{ position: "relative", padding: "128px 24px 64px", overflow: "hidden" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <SectionEyebrow>Documentation</SectionEyebrow>
          <h1 className="font-display" style={{ fontSize: "clamp(36px,5vw,64px)", fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.02em", color: "var(--hs-ink)", margin: "16px 0 24px" }}>
            Build with HoundShield.
          </h1>
          <p style={{ fontSize: 18, color: "var(--hs-ink-secondary)", maxWidth: 640 }}>Deploy guides, detection patterns, API reference, and compliance mapping.</p>
        </div>
      </section>
      <section className="spotlight" style={{ position: "relative", padding: "32px 24px 96px", overflow: "hidden" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {SECTIONS.map((s) => (
              <Link key={s.title} href={s.href} className="glass-card" style={{ padding: 28, display: "block" }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: "var(--hs-mist-md)", color: "var(--hs-steel-dark)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>{s.icon}</div>
                <h3 className="font-display" style={{ fontSize: 20, fontWeight: 600, color: "var(--hs-ink)", letterSpacing: "-0.01em", marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "var(--hs-ink-secondary)", lineHeight: 1.6, marginBottom: 14 }}>{s.body}</p>
                <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: "var(--hs-steel-dark)", fontSize: 13 }}>Read <ArrowRight className="w-3.5 h-3.5" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
