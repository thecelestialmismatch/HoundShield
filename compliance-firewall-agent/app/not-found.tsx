import Link from "next/link";
import { PublicShell } from "@/components/layout/PublicShell";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";

export default function NotFound() {
  return (
    <PublicShell>
      <section
        style={{
          padding: "160px 24px 120px",
          maxWidth: 720,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <SectionEyebrow>404 — Not found</SectionEyebrow>
        <h1
          className="font-display"
          style={{
            fontSize: "clamp(40px,6vw,72px)",
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "var(--hs-ink)",
            margin: "16px 0 16px",
          }}
        >
          This page slipped<br />the audit.
        </h1>
        <p style={{ fontSize: 18, color: "var(--hs-ink-secondary)", marginBottom: 32 }}>
          We couldn&apos;t find what you were looking for. The proxy is still running — just this URL didn&apos;t match a known route.
        </p>
        <Link
          href="/"
          className="text-white inline-flex items-center gap-2"
          style={{
            padding: "12px 20px",
            borderRadius: 10,
            fontWeight: 600,
            background: "linear-gradient(135deg, var(--hs-steel-dark), var(--hs-steel))",
            boxShadow: "0 4px 12px rgba(90,134,168,0.25)",
          }}
        >
          Back to safety →
        </Link>
      </section>
    </PublicShell>
  );
}
