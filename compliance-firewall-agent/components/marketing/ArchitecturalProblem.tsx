import { SectionEyebrow } from "./SectionEyebrow";

const BAD_BULLETS = [
  "Cloud DLP sends your CUI offsite",
  "You're trusting their security posture",
  "Another company now has your data",
  "Audit trail lives on their servers",
];

const GOOD_BULLETS = [
  "HoundShield scans locally, nothing exits",
  "You own the audit log, always",
  "DFARS 7012 compliant by design",
  "C3PAO audit PDF in one click",
];

export function ArchitecturalProblem() {
  return (
    <section className="spotlight hs-dark" style={{ position: "relative", padding: "96px 24px", overflow: "hidden" }}>
      <div
        className="hs-arch-grid"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          position: "relative",
          zIndex: 2,
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          gap: 64,
          alignItems: "start",
        }}
      >
        <div>
          <SectionEyebrow variant="sky">The architectural problem</SectionEyebrow>
          <h2
            className="font-display"
            style={{
              fontSize: "clamp(28px,3.6vw,44px)",
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.015em",
              color: "#FAFCFF",
              margin: "12px 0 16px",
            }}
          >
            Every other tool makes
            <br />
            the problem worse.
          </h2>
          <p style={{ fontSize: 17, color: "rgba(197,218,233,0.75)", maxWidth: 560, lineHeight: 1.6 }}>
            Every cloud-based AI DLP tool sends your CUI to <em>their</em> servers to scan it. That's itself a potential CUI spill under DFARS 7012. HoundShield scans everything locally. Nothing leaves your network.
          </p>
          <div
            className="hs-arch-bullets"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px 24px",
              marginTop: 28,
            }}
          >
            {BAD_BULLETS.map((b) => (
              <div key={b} style={{ display: "flex", alignItems: "start", gap: 10, fontSize: 14, lineHeight: 1.5, color: "rgba(255,180,180,0.92)" }}>
                <span style={{ color: "#FF7A7A", fontWeight: 700 }} aria-hidden>
                  ✗
                </span>
                {b}
              </div>
            ))}
            {GOOD_BULLETS.map((b) => (
              <div key={b} style={{ display: "flex", alignItems: "start", gap: 10, fontSize: 14, lineHeight: 1.5, color: "rgba(150,230,180,0.92)" }}>
                <span style={{ color: "#7AE6A4", fontWeight: 700 }} aria-hidden>
                  ✓
                </span>
                {b}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gap: 18 }}>
          <CompareCard
            variant="bad"
            name="Cloud DLP Competitor"
            badge="DFARS Violation Risk"
            flow={["User", "Prompt", "Cloud DLP ⚠", "AI Model"]}
            dangerIdx={2}
            note="CUI transmitted to vendor servers — potential DFARS 7012 violation."
          />
          <CompareCard
            variant="good"
            name="HoundShield"
            badge="Compliant"
            flow={["User", "Prompt", "Local Proxy 🔒", "AI Model"]}
            dangerIdx={2}
            note="Everything scanned locally inside your network. Zero exfiltration."
          />
        </div>
      </div>
      <style>{`
        @media (max-width: 1000px) {
          .hs-arch-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 700px) {
          .hs-arch-bullets { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

interface CompareCardProps {
  variant: "bad" | "good";
  name: string;
  badge: string;
  flow: string[];
  dangerIdx: number;
  note: string;
}

function CompareCard({ variant, name, badge, flow, dangerIdx, note }: CompareCardProps) {
  const bad = variant === "bad";
  return (
    <div
      style={{
        borderRadius: 14,
        padding: "20px 22px",
        position: "relative",
        border: `1px solid ${bad ? "rgba(255,90,90,0.32)" : "rgba(120,220,150,0.35)"}`,
        background: bad ? "rgba(255,90,90,0.04)" : "rgba(120,220,150,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        <span style={{ color: "#fff" }}>
          <span style={{ color: bad ? "#FF7A7A" : "#7AE6A4", marginRight: 6 }}>{bad ? "✗" : "✓"}</span>
          {name}
        </span>
        <span
          style={{
            padding: "3px 8px",
            borderRadius: 4,
            fontSize: 9,
            fontWeight: 700,
            background: bad ? "rgba(255,90,90,0.15)" : "rgba(120,220,150,0.15)",
            color: bad ? "#FF9090" : "#86E0A6",
          }}
        >
          {badge}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontFamily: "var(--font-mono)", fontSize: 12 }}>
        {flow.map((node, i) => (
          <span key={`${node}-${i}`} style={{ display: "contents" }}>
            <span
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border:
                  i === dangerIdx
                    ? bad
                      ? "1px solid rgba(255,90,90,0.40)"
                      : "1px solid rgba(120,220,150,0.40)"
                    : "1px solid rgba(197,218,233,0.20)",
                background:
                  i === dangerIdx
                    ? bad
                      ? "rgba(255,90,90,0.08)"
                      : "rgba(120,220,150,0.08)"
                    : "rgba(197,218,233,0.04)",
                color: i === dangerIdx ? (bad ? "#FF9090" : "#86E0A6") : "#E4ECF4",
              }}
            >
              {node}
            </span>
            {i < flow.length - 1 && (
              <span style={{ opacity: 0.5, color: bad ? "#FF7A7A" : "#7AE6A4" }} aria-hidden>
                —
              </span>
            )}
          </span>
        ))}
      </div>
      <p style={{ marginTop: 12, fontSize: 12.5, color: bad ? "rgba(255,150,150,0.85)" : "rgba(150,220,180,0.85)" }}>{note}</p>
    </div>
  );
}
