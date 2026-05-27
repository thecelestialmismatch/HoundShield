import { SectionEyebrow } from "./SectionEyebrow";

interface FaqItem {
  q: string;
  a: string;
}

const DEFAULT_FAQ: FaqItem[] = [
  {
    q: "Does the free tier scan my actual prompts?",
    a: "Yes. All 16 detection engines run on Free — the only difference is daily request volume (500/day) and log retention (7 days). Your CUI never leaves your network on any tier.",
  },
  {
    q: "How is my data not seen by HoundShield servers?",
    a: "Scanning runs locally in the proxy process you deploy. Only metadata (license key hash, prompt count, timestamp) reaches our control plane. Prompt content stays inside your perimeter.",
  },
  {
    q: "Will my C3PAO accept the PDF report?",
    a: "Yes — the PDF cites NIST SP 800-171 Rev 2 controls by number and includes the SHA-256 hash-chained violation log. We built it from feedback with three C3PAOs.",
  },
  {
    q: "Can I deploy on-prem / air-gapped?",
    a: "Enterprise and Agency tiers ship a Docker image you run inside your own perimeter. Air-gapped mode available — no outbound connections at all.",
  },
  {
    q: "What if I exceed my plan?",
    a: "We don't hard-block — we email you at 80% and 100% and let you upgrade in-app. No surprise overage charges.",
  },
];

export function Faq({ items = DEFAULT_FAQ }: { items?: FaqItem[] }) {
  return (
    <section className="spotlight" style={{ position: "relative", padding: "96px 24px", overflow: "hidden" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 2 }}>
        <SectionEyebrow>Common questions</SectionEyebrow>
        <h2
          className="font-display"
          style={{
            fontSize: "clamp(28px,3.6vw,44px)",
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: "-0.015em",
            color: "var(--hs-ink)",
            margin: "12px 0 40px",
          }}
        >
          Before you sign up.
        </h2>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          {items.map((item, i) => (
            <details
              key={item.q}
              open={i === 0}
              className="hs-faq-row"
              style={{
                border: "1px solid var(--hs-border-subtle)",
                background: "#fff",
                borderRadius: 14,
                marginBottom: 10,
                overflow: "hidden",
                transition: "border-color .2s, background .2s",
              }}
            >
              <summary
                style={{
                  padding: "20px 24px",
                  cursor: "pointer",
                  fontWeight: 500,
                  fontSize: 16,
                  color: "var(--hs-ink)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  listStyle: "none",
                }}
              >
                {item.q}
                <span aria-hidden style={{ color: "var(--hs-ink-tertiary)", fontSize: 22 }}>
                  +
                </span>
              </summary>
              <p style={{ padding: "0 24px 22px", color: "var(--hs-ink-secondary)", fontSize: 14.5, lineHeight: 1.65 }}>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
      <style>{`
        .hs-faq-row:hover { background: var(--hs-mist) !important; border-color: var(--hs-border) !important; }
        .hs-faq-row summary::-webkit-details-marker { display: none; }
        .hs-faq-row[open] summary span[aria-hidden] { transform: rotate(45deg); transition: transform .2s; }
      `}</style>
    </section>
  );
}
