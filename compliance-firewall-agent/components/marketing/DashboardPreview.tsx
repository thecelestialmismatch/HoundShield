"use client";

import { useEffect, useState } from "react";

interface ScanRow {
  kind: "block" | "pass";
  label: string;
  ms: string;
}

const ROWS: ScanRow[] = [
  { kind: "block", label: "ITAR Export Control", ms: "7ms" },
  { kind: "pass", label: "Quarterly metrics request", ms: "11ms" },
  { kind: "block", label: "Contract Number CUI", ms: "6ms" },
  { kind: "block", label: "CAGE Code 1H4N7", ms: "5ms" },
  { kind: "pass", label: "Code review snippet", ms: "13ms" },
  { kind: "block", label: "SSN pattern", ms: "4ms" },
  { kind: "pass", label: "General brainstorm", ms: "8ms" },
  { kind: "block", label: "Drawing reference", ms: "9ms" },
  { kind: "pass", label: "Email draft", ms: "10ms" },
];

/** Inline live dashboard preview: proxy-config code + scrolling scan log. */
export function DashboardPreview() {
  const [visible, setVisible] = useState<ScanRow[]>(ROWS.slice(0, 3));

  useEffect(() => {
    let idx = 3;
    const id = setInterval(() => {
      setVisible((prev) => {
        const next = ROWS[idx % ROWS.length];
        idx += 1;
        const updated = [...prev, next];
        return updated.length > 5 ? updated.slice(updated.length - 5) : updated;
      });
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        background: "#0F1E2E",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 20px 60px rgba(15,30,46,0.25)",
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        color: "#C5DAE9",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          fontSize: 11,
          color: "#7B96B0",
          letterSpacing: "0.05em",
        }}
      >
        <span>proxy-config.env</span>
        <span
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#C5DAE9",
            padding: "4px 10px",
            borderRadius: 6,
            fontSize: 11,
          }}
        >
          Copy
        </span>
      </div>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          lineHeight: 1.7,
          color: "#C5DAE9",
          marginBottom: 18,
          fontFamily: "inherit",
        }}
      >
        <span style={{ color: "#6B8299" }}># Before — sending to OpenAI directly</span>
        {"\n"}OPENAI_BASE_URL=<span style={{ color: "#AACDDC" }}>https://api.openai.com/v1</span>
        {"\n\n"}
        <span style={{ color: "#6B8299" }}># After — routed through HoundShield</span>
        {"\n"}OPENAI_BASE_URL=
        <span style={{ color: "#AACDDC" }}>https://proxy.houndshield.com/v1</span>
      </pre>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.10)", paddingTop: 14 }}>
        {visible.map((row, i) => (
          <div
            key={`${row.label}-${i}`}
            style={{
              display: "grid",
              gridTemplateColumns: "90px 1fr 60px",
              alignItems: "center",
              gap: 10,
              padding: "6px 0",
              animation: "hs-row-in 0.4s forwards",
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
                background: row.kind === "block" ? "rgba(225,75,75,0.18)" : "rgba(112,200,140,0.18)",
                color: row.kind === "block" ? "#FF9090" : "#86E0A6",
              }}
            >
              {row.kind === "block" ? "Blocked" : "Passed"}
            </span>
            <span style={{ color: "#E4ECF4", fontSize: 12 }}>{row.label}</span>
            <span style={{ color: "#7B96B0", textAlign: "right", fontSize: 11 }}>{row.ms}</span>
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes hs-row-in {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
