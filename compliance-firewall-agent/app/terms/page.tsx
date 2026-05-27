import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/PublicShell";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "HoundShield terms of service.",
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p style={{ fontSize: 13, color: "var(--hs-ink-tertiary)", marginBottom: 40 }}>
          Last updated: 2026-05-27
        </p>

        <div className="hs-legal" style={{ fontSize: 15.5, lineHeight: 1.75, color: "var(--hs-ink-secondary)" }}>
          <Section title="Acceptance">
            By using HoundShield (the &quot;Service&quot;), you accept these terms. If you don&apos;t agree, don&apos;t use the Service.
          </Section>
          <Section title="License">
            HoundShield grants you a non-exclusive, non-transferable license to deploy the proxy on your own infrastructure for the duration of your active subscription. Reverse-engineering the detection patterns is prohibited.
          </Section>
          <Section title="Acceptable use">
            <ul>
              <li>No bypassing detection engines on prompts containing actual CUI/PHI you don&apos;t own</li>
              <li>No reselling without a signed Agency-tier or partner agreement</li>
              <li>No publishing benchmark results comparing HoundShield to competitors without our written consent</li>
            </ul>
          </Section>
          <Section title="Service availability">
            We target 99.9% uptime on the control plane. The proxy runs on your infrastructure — its availability is your operational responsibility.
          </Section>
          <Section title="Liability">
            HoundShield is provided as-is. We&apos;re not liable for indirect, incidental, or consequential damages. Total liability capped at fees paid in the prior 12 months.
          </Section>
          <Section title="Governing law">
            These terms are governed by the laws of the State of Delaware, USA, without regard to conflict-of-laws principles.
          </Section>
          <Section title="Contact">
            <a href="mailto:legal@houndshield.com" style={{ color: "var(--hs-steel-dark)", fontWeight: 500 }}>
              legal@houndshield.com
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
