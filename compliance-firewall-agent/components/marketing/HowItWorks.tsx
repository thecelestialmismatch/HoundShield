import { NumberedStep } from "./NumberedStep";
import { SectionEyebrow } from "./SectionEyebrow";

const proxyConfigSnippet = (
  <div
    style={{
      background: "#07151F",
      color: "#C5DAE9",
      borderRadius: 12,
      padding: 20,
      fontFamily: "var(--font-mono)",
      fontSize: 12.5,
      lineHeight: 1.75,
    }}
  >
    <div style={{ color: "#6B8299" }}># Before — sending to OpenAI directly</div>
    <div>
      OPENAI_BASE_URL=<span style={{ color: "#AACDDC" }}>https://api.openai.com/v1</span>
    </div>
    <div style={{ marginTop: 12, color: "#6B8299" }}># After — routed through HoundShield</div>
    <div>
      OPENAI_BASE_URL=<span style={{ color: "#AACDDC" }}>https://proxy.houndshield.com/v1</span>
    </div>
  </div>
);

const scanLogSnippet = (
  <div
    style={{
      background: "#07151F",
      borderRadius: 12,
      padding: 14,
      fontFamily: "var(--font-mono)",
      fontSize: 12,
    }}
  >
    {[
      { kind: "Blocked", label: "ITAR Export Control", ms: "7ms", c: "#FF9090", bg: "rgba(225,75,75,0.18)" },
      { kind: "Passed", label: "No CUI detected", ms: "9ms", c: "#86E0A6", bg: "rgba(112,200,140,0.18)" },
      { kind: "Blocked", label: "Contract Number CUI", ms: "6ms", c: "#FF9090", bg: "rgba(225,75,75,0.18)" },
    ].map((row) => (
      <div
        key={row.label}
        style={{
          display: "grid",
          gridTemplateColumns: "90px 1fr 60px",
          alignItems: "center",
          gap: 10,
          padding: "8px 6px",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            padding: "3px 8px",
            borderRadius: 4,
            textTransform: "uppercase",
            background: row.bg,
            color: row.c,
          }}
        >
          {row.kind}
        </span>
        <span style={{ color: "#E4ECF4", fontSize: 12 }}>{row.label}</span>
        <span style={{ color: "#7B96B0", textAlign: "right", fontSize: 11 }}>{row.ms}</span>
      </div>
    ))}
  </div>
);

const pdfSnippet = (
  <div
    style={{
      background: "#07151F",
      borderRadius: 12,
      padding: 18,
      fontFamily: "var(--font-mono)",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, color: "#C5DAE9", fontSize: 12.5 }}>
      📄 CMMC_AUDIT_REPORT_2026.pdf
    </div>
    <div style={{ fontSize: 12, lineHeight: 1.9, color: "#AACDDC" }}>
      <div>✓ NIST SP 800-171 Rev 2 — 110 Controls</div>
      <div>✓ DFARS 7012 Compliance Status</div>
      <div>✓ Violation Log (SHA-256 tamper-proof)</div>
      <div>✓ C3PAO Assessment Ready</div>
    </div>
  </div>
);

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="spotlight hs-dark"
      style={{ position: "relative", padding: "96px 24px", overflow: "hidden" }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 2 }}>
        <SectionEyebrow variant="sky">Deployment</SectionEyebrow>
        <h2
          className="font-display"
          style={{
            fontSize: "clamp(28px,3.6vw,44px)",
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: "-0.015em",
            color: "#FAFCFF",
            margin: "12px 0 0",
          }}
        >
          Live in ten minutes.
          <br />
          Audited in ten seconds.
        </h2>
        <div style={{ marginTop: 48 }}>
          <NumberedStep
            num="01"
            title="Change one URL"
            body="Set your AI tool's API base URL to your HoundShield proxy endpoint. Claude, GPT-4, Gemini — any OpenAI-compatible model. Done."
            aside={proxyConfigSnippet}
          />
          <NumberedStep
            num="02"
            title="Every prompt scanned locally"
            body="16 detection engines run in parallel. Blocked prompts return a policy violation message in <10ms. Passed prompts are forwarded transparently. Your team notices nothing."
            aside={scanLogSnippet}
          />
          <NumberedStep
            num="03"
            title="Audit PDF on demand"
            body="Every violation logged with timestamp, user, prompt hash, matched pattern, and NIST control reference. SHA-256 tamper-proof. One click generates the C3PAO-ready PDF."
            aside={pdfSnippet}
            isLast
          />
        </div>
      </div>
    </section>
  );
}
