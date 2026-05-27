interface NumberedStepProps {
  num: string;
  title: string;
  body: string;
  aside: React.ReactNode;
  isLast?: boolean;
}

export function NumberedStep({ num, title, body, aside, isLast = false }: NumberedStepProps) {
  return (
    <div
      className="hs-step"
      style={{
        display: "grid",
        gridTemplateColumns: "120px 1fr 1fr",
        gap: 48,
        alignItems: "start",
        padding: "48px 0",
        borderBottom: isLast ? "none" : "1px solid rgba(197,218,233,0.12)",
      }}
    >
      <div
        className="font-display"
        style={{
          fontSize: 64,
          fontWeight: 500,
          color: "rgba(197,218,233,0.45)",
          lineHeight: 1,
          letterSpacing: "-0.04em",
        }}
      >
        {num}
      </div>
      <div>
        <h3
          className="font-display"
          style={{
            fontSize: 30,
            fontWeight: 600,
            color: "#FAFCFF",
            letterSpacing: "-0.015em",
            marginBottom: 12,
            lineHeight: 1.15,
          }}
        >
          {title}
        </h3>
        <p style={{ fontSize: 15, color: "rgba(197,218,233,0.78)", lineHeight: 1.65 }}>{body}</p>
      </div>
      <div>{aside}</div>
      <style>{`
        @media (max-width: 900px) {
          .hs-step { grid-template-columns: 1fr !important; gap: 16px !important; }
        }
      `}</style>
    </div>
  );
}
