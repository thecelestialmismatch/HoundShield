import { SectionEyebrow } from "./SectionEyebrow";

interface Feature {
  ic: string;
  title: string;
  body: string;
}

const DEFAULT_FEATURES: Feature[] = [
  {
    ic: "▦",
    title: "100% Local Scanning",
    body: "Zero bytes of your prompts or CUI reach our servers or any external service. Your data stays inside your perimeter. Always.",
  },
  {
    ic: "✓",
    title: "C3PAO-Ready PDF Reports",
    body: "One click generates a formatted audit document citing specific NIST SP 800-171 Rev 2 controls. Your assessor has seen exactly this format.",
  },
  {
    ic: "⚡",
    title: "Zero-Friction Deployment",
    body: "Change one proxy URL in your AI tool configuration. No agents, no firewall rules, no IT ticket. Live in under 10 minutes.",
  },
  {
    ic: "∿",
    title: "OODA Behavioral Engine",
    body: "Detects policy drift before it becomes a spill. Learns your team's patterns and flags anomalies in real time.",
  },
  {
    ic: "⛨",
    title: "16 CUI Detection Patterns",
    body: "Contracts, drawings, export codes, PII, ITAR, CAGE codes, FOUO classifications — all matched locally in parallel.",
  },
  {
    ic: "◍",
    title: "Brain AI Compliance Advisor",
    body: "Ask any CMMC question, get cited answers from NIST 800-171, DFARS, and CMMC 2.0. Your compliance knowledge base, always available.",
  },
];

interface FeatureGridProps {
  eyebrow?: string;
  headline?: React.ReactNode;
  sub?: string;
  features?: Feature[];
}

export function FeatureGrid({
  eyebrow = "What's inside",
  headline = (
    <>
      Built for the audit.
      <br />
      Not for the demo.
    </>
  ),
  sub = "Every feature maps to a NIST SP 800-171 control.",
  features = DEFAULT_FEATURES,
}: FeatureGridProps) {
  return (
    <section id="features" className="spotlight" style={{ position: "relative", padding: "96px 24px", overflow: "hidden" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 2 }}>
        <SectionEyebrow>{eyebrow}</SectionEyebrow>
        <h2
          className="font-display"
          style={{
            fontSize: "clamp(28px,3.6vw,44px)",
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: "-0.015em",
            color: "var(--hs-ink)",
            margin: "12px 0 16px",
          }}
        >
          {headline}
        </h2>
        <p style={{ fontSize: 18, color: "var(--hs-ink-secondary)", maxWidth: 560, marginBottom: 48 }}>{sub}</p>
        <div
          className="hs-feature-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 1,
            background: "var(--hs-border-subtle)",
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid var(--hs-border-subtle)",
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              className="hs-feature-card"
              style={{
                background: "#fff",
                padding: "40px 32px",
                transition: "background .2s, transform .2s",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "var(--hs-mist-md)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--hs-steel-dark)",
                  marginBottom: 18,
                  fontSize: 20,
                }}
              >
                {f.ic}
              </div>
              <h3
                className="font-display"
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: "var(--hs-ink)",
                  marginBottom: 10,
                  letterSpacing: "-0.01em",
                }}
              >
                {f.title}
              </h3>
              <p style={{ fontSize: 14, color: "var(--hs-ink-secondary)", lineHeight: 1.6 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .hs-feature-grid { grid-template-columns: 1fr !important; }
        }
        .hs-feature-card:hover { background: var(--hs-mist) !important; transform: translateY(-2px); }
      `}</style>
    </section>
  );
}
