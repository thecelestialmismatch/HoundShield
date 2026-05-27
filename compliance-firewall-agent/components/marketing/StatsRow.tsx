interface Stat {
  k: string;
  v: string;
  label: string;
}

const DEFAULT_STATS: Stat[] = [
  { k: "Patterns", v: "16", label: "Detection engines" },
  { k: "Exposure", v: "300K+", label: "DoD contractors at risk" },
  { k: "Deadline", v: "Nov 2026", label: "CMMC enforcement" },
  { k: "Speed", v: "<10ms", label: "Scan latency" },
];

interface StatsRowProps {
  stats?: Stat[];
}

export function StatsRow({ stats = DEFAULT_STATS }: StatsRowProps) {
  return (
    <section
      style={{
        background: "var(--hs-surface-2)",
        borderTop: "1px solid var(--hs-border-subtle)",
        borderBottom: "1px solid var(--hs-border-subtle)",
      }}
    >
      <div
        className="hs-stats-grid"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
        }}
      >
        {stats.map((s, i) => (
          <div
            key={s.k}
            style={{
              padding: "32px 28px",
              borderRight: i < stats.length - 1 ? "1px solid rgba(15,30,46,0.08)" : "none",
            }}
          >
            <div
              className="font-mono uppercase"
              style={{
                fontSize: 11,
                letterSpacing: "0.18em",
                color: "var(--hs-ink-tertiary)",
                marginBottom: 10,
              }}
            >
              {s.k}
            </div>
            <div
              className="font-display"
              style={{
                fontSize: 36,
                fontWeight: 600,
                color: "var(--hs-ink)",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              {s.v}
            </div>
            <div style={{ fontSize: 13, color: "var(--hs-ink-secondary)", marginTop: 6 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <style>{`
        @media (max-width: 900px) {
          .hs-stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .hs-stats-grid > div { border-right: none !important; border-bottom: 1px solid rgba(15,30,46,0.08); }
        }
      `}</style>
    </section>
  );
}
