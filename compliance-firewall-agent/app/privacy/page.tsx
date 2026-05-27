import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/PublicShell";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "HoundShield privacy policy — what data we collect, where it lives, and how we protect it.",
};

export default function PrivacyPage() {
  return (
    <PublicShell>
      <section style={{ padding: "128px 24px 96px", maxWidth: 800, margin: "0 auto" }}>
        <SectionEyebrow>Legal</SectionEyebrow>
        <h1
          className="font-display"
          style={{
            fontSize: "clamp(36px,5vw,52px)",
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "var(--hs-ink)",
            margin: "16px 0 16px",
          }}
        >
          Privacy Policy
        </h1>
        <p style={{ fontSize: 13, color: "var(--hs-ink-tertiary)", marginBottom: 40 }}>
          Last updated: 2026-05-27
        </p>

        <div className="hs-legal" style={{ fontSize: 15.5, lineHeight: 1.75, color: "var(--hs-ink-secondary)" }}>
          <Section title="The short version">
            HoundShield is a local-only proxy. Prompt content scanned by HoundShield <strong>never leaves your network</strong>. Our servers receive only: license-key hash, prompt count, timestamp.
          </Section>

          <Section title="Data we collect">
            <ul>
              <li>License key hash (SHA-256) — for entitlement validation</li>
              <li>Prompt scan count — for usage metering</li>
              <li>Timestamp + region — for analytics</li>
              <li>Email + account info — only if you sign up for the dashboard</li>
            </ul>
          </Section>

          <Section title="Data we do NOT collect">
            <ul>
              <li>Prompt content — never sent anywhere from your proxy</li>
              <li>CUI, PHI, PII matched by detection engines — stays in your audit log on your infra</li>
              <li>AI model responses — pass through transparently</li>
              <li>User identity tied to prompts — anonymized in logs</li>
            </ul>
          </Section>

          <Section title="Where data lives">
            Customer-deployed proxy: your infrastructure (Docker host, Kubernetes cluster, or air-gapped). Control plane: Vercel + Supabase US-East. Audit logs: stay where you deploy the proxy.
          </Section>

          <Section title="Your rights">
            Delete your account anytime. Export your data anytime. We comply with GDPR, CCPA, and applicable state-level privacy laws.
          </Section>

          <Section title="Contact">
            <a href="mailto:privacy@houndshield.com" style={{ color: "var(--hs-steel-dark)", fontWeight: 500 }}>
              privacy@houndshield.com
            </a>
          </Section>
        </div>

        <style>{`
          .hs-legal h2 { font-family: var(--font-display); font-size: 22px; font-weight: 600; color: var(--hs-ink); margin: 32px 0 12px; letter-spacing: -0.01em; }
          .hs-legal ul { margin: 0 0 16px 22px; }
          .hs-legal li { margin-bottom: 6px; }
        `}</style>
      </section>
    </PublicShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <h2>{title}</h2>
      <div>{children}</div>
    </>
  );
}
