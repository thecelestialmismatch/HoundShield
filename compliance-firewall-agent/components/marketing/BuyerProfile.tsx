import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionEyebrow } from "./SectionEyebrow";

interface BuyerProfileProps {
  quote?: string;
  attrib?: string;
  tags?: string[];
  name?: string;
  rows?: Array<{ k: string; v: string }>;
  ctaLabel?: string;
  ctaHref?: string;
}

const DEFAULT_TAGS = ["⛨ CMMC Level 2 Mapping", "📄 NIST SP 800-171 Rev 2 Citations", "🔒 DFARS 7012 Compliant"];

const DEFAULT_ROWS = [
  { k: "Role", v: "IT Security Manager" },
  { k: "Company", v: "50–250 person DoD prime contractor" },
  { k: "Fear", v: "Failing CMMC from a ChatGPT incident" },
  { k: "Goal", v: "The audit PDF her C3PAO accepts" },
  { k: "Budget", v: "$0–$1K/mo unilateral authority" },
  { k: "Deadline", v: "November 2026 enforcement" },
];

export function BuyerProfile({
  quote = "I needed the PDF I could hand my C3PAO assessor. HoundShield gave me that PDF.",
  attrib = "— IT Security Manager, 180-person DoD prime contractor",
  tags = DEFAULT_TAGS,
  name = "Built for Jordan",
  rows = DEFAULT_ROWS,
  ctaLabel = "Jordan signs up in 4 minutes. Start free",
  ctaHref = "/signup",
}: BuyerProfileProps) {
  return (
    <section className="spotlight" style={{ position: "relative", padding: "96px 24px", overflow: "hidden" }}>
      <div
        className="hs-buyer-grid"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          position: "relative",
          zIndex: 2,
          display: "grid",
          gridTemplateColumns: "1fr 480px",
          gap: 48,
          alignItems: "center",
        }}
      >
        <div>
          <SectionEyebrow>Built for her</SectionEyebrow>
          <p
            className="font-display"
            style={{
              marginTop: 14,
              fontStyle: "italic",
              fontSize: 32,
              lineHeight: 1.3,
              color: "var(--hs-ink)",
              letterSpacing: "-0.01em",
            }}
          >
            "{quote}"
          </p>
          <p style={{ marginTop: 14, fontSize: 13, color: "var(--hs-ink-tertiary)" }}>{attrib}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 24 }}>
            {tags.map((t) => (
              <span
                key={t}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 9999,
                  border: "1px solid var(--hs-border)",
                  background: "#fff",
                  fontSize: 12,
                  color: "var(--hs-ink-secondary)",
                  fontWeight: 500,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div
          style={{
            background: "var(--hs-surface-2)",
            borderRadius: 24,
            padding: "36px 32px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <span
            aria-hidden
            style={{
              position: "absolute",
              bottom: -40,
              right: -40,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "var(--hs-surface-3)",
              opacity: 0.6,
            }}
          />
          <SectionEyebrow variant="muted">Your buyer profile</SectionEyebrow>
          <h3
            className="font-display"
            style={{
              fontSize: 32,
              fontWeight: 600,
              color: "var(--hs-ink)",
              margin: "10px 0 24px",
              letterSpacing: "-0.015em",
              position: "relative",
              zIndex: 2,
            }}
          >
            {name}
          </h3>
          {rows.map((row, i) => (
            <div
              key={row.k}
              style={{
                display: "grid",
                gridTemplateColumns: "90px 1fr",
                gap: 16,
                padding: "10px 0",
                borderTop: i === 0 ? "none" : "1px solid rgba(15,30,46,0.08)",
                position: "relative",
                zIndex: 2,
              }}
            >
              <span
                className="font-mono uppercase"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  color: "var(--hs-ink-tertiary)",
                  paddingTop: 2,
                }}
              >
                {row.k}
              </span>
              <span style={{ fontSize: 14.5, color: "var(--hs-ink)", fontWeight: 500 }}>{row.v}</span>
            </div>
          ))}
          <Link
            href={ctaHref}
            style={{
              marginTop: 24,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "var(--hs-steel-dark)",
              fontWeight: 600,
              fontSize: 14,
              position: "relative",
              zIndex: 2,
            }}
          >
            {ctaLabel} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .hs-buyer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
