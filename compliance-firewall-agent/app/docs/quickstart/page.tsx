import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/PublicShell";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";
import { HowItWorks } from "@/components/marketing/HowItWorks";

export const metadata: Metadata = {
  title: "Quickstart — Deploy HoundShield in 10 minutes",
  description: "Pull the Docker image, set 3 environment variables, point your AI tools at the proxy. Done.",
};

const CodeBlock = ({ children }: { children: string }) => (
  <pre
    style={{
      background: "#0F1E2E",
      color: "#C5DAE9",
      padding: 20,
      borderRadius: 12,
      fontFamily: "var(--font-mono)",
      fontSize: 13,
      lineHeight: 1.7,
      overflow: "auto",
      whiteSpace: "pre",
    }}
  >
    {children}
  </pre>
);

export default function QuickstartPage() {
  return (
    <PublicShell>
      <section className="spotlight" style={{ position: "relative", padding: "128px 24px 32px", overflow: "hidden" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <SectionEyebrow>Quickstart</SectionEyebrow>
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
            Deploy in 10 minutes.
          </h1>
          <p style={{ fontSize: 18, color: "var(--hs-ink-secondary)" }}>
            Pull the Docker image, set 3 environment variables, point your AI tools at the proxy.
          </p>
        </div>
      </section>

      <section className="spotlight" style={{ position: "relative", padding: "48px 24px 96px", overflow: "hidden" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", position: "relative", zIndex: 2, display: "grid", gap: 40 }}>
          <Step title="1. Pull the Docker image">
            <CodeBlock>{`docker pull houndshield/proxy:latest

# Verify signature (cosign keyless OIDC)
cosign verify houndshield/proxy:latest \\
  --certificate-identity-regexp '.*'\\
  --certificate-oidc-issuer-regexp '.*'`}</CodeBlock>
          </Step>

          <Step title="2. Set environment variables">
            <CodeBlock>{`# .env
HOUNDSHIELD_LICENSE_KEY=hs_live_xxx           # from your dashboard
HOUNDSHIELD_UPSTREAM=https://api.openai.com   # or anthropic.com, gemini, etc.
HOUNDSHIELD_LOG_DIR=/var/log/houndshield      # audit log destination`}</CodeBlock>
          </Step>

          <Step title="3. Run the proxy">
            <CodeBlock>{`docker run -d --name houndshield \\
  --env-file .env \\
  -p 8443:8443 \\
  -v /var/log/houndshield:/var/log/houndshield \\
  houndshield/proxy:latest

# Health check
curl https://localhost:8443/health
# → { "status": "ok", "engines": 16, "uptime_s": 3 }`}</CodeBlock>
          </Step>

          <Step title="4. Point your AI tools at the proxy">
            <CodeBlock>{`# Before — direct
OPENAI_BASE_URL=https://api.openai.com/v1

# After — through HoundShield
OPENAI_BASE_URL=https://proxy.your-company.internal/v1`}</CodeBlock>
          </Step>

          <Step title="5. Generate your first audit PDF">
            <CodeBlock>{`curl -X POST https://proxy.your-company.internal/api/audit/pdf \\
  -H "Authorization: Bearer $HOUNDSHIELD_LICENSE_KEY" \\
  -o cmmc-audit-2026-q2.pdf

# 110 NIST 800-171 Rev 2 controls
# SHA-256 hash chain
# Ready for C3PAO`}</CodeBlock>
          </Step>
        </div>
      </section>

      <HowItWorks />
    </PublicShell>
  );
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2
        className="font-display"
        style={{
          fontSize: 26,
          fontWeight: 600,
          color: "var(--hs-ink)",
          letterSpacing: "-0.015em",
          marginBottom: 14,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}
