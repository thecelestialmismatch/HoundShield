import Link from "next/link";

export interface Tier {
  name: string;
  meta: string;
  price: string;
  unit?: string;
  ctaLabel: string;
  ctaHref: string;
  features: string[];
  featured?: boolean;
}

export function PricingTier({ tier }: { tier: Tier }) {
  const featured = !!tier.featured;
  return (
    <div
      style={{
        background: "#fff",
        border: featured ? "2px solid var(--hs-steel)" : "1px solid var(--hs-border-subtle)",
        borderRadius: 18,
        padding: "28px 22px",
        position: "relative",
        transition: "transform .2s, box-shadow .2s, border-color .2s",
        boxShadow: featured ? "0 14px 36px rgba(129,166,198,0.18)" : "0 2px 10px rgba(15,30,46,0.04)",
      }}
      className="hs-tier-card"
    >
      {featured && (
        <span
          className="font-mono uppercase"
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "5px 14px",
            borderRadius: 9999,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.16em",
            background: "var(--hs-sky)",
            color: "var(--hs-ink)",
          }}
        >
          Most Popular
        </span>
      )}
      <h4
        className="font-display"
        style={{ fontSize: 24, fontWeight: 600, color: "var(--hs-ink)", letterSpacing: "-0.01em" }}
      >
        {tier.name}
      </h4>
      <div style={{ fontSize: 12.5, color: "var(--hs-ink-tertiary)", marginTop: 4 }}>{tier.meta}</div>
      <div
        className="font-display"
        style={{
          fontSize: 42,
          fontWeight: 600,
          color: "var(--hs-ink)",
          margin: "24px 0 6px",
          letterSpacing: "-0.02em",
        }}
      >
        {tier.price}
        <span style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, color: "var(--hs-ink-tertiary)", marginLeft: 4 }}>
          {tier.unit ?? "/mo"}
        </span>
      </div>
      <Link
        href={tier.ctaHref}
        style={{
          display: "block",
          width: "100%",
          padding: "11px 16px",
          borderRadius: 10,
          textAlign: "center",
          fontSize: 14,
          fontWeight: 600,
          margin: "24px 0 22px",
          border: featured ? "1px solid transparent" : "1px solid var(--hs-border)",
          color: featured ? "#fff" : "var(--hs-ink)",
          background: featured ? "linear-gradient(135deg, var(--hs-steel-dark), var(--hs-steel))" : "#fff",
          boxShadow: featured ? "0 4px 12px rgba(90,134,168,0.25)" : undefined,
          transition: "all .2s",
        }}
      >
        {tier.ctaLabel}
      </Link>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, padding: 0, margin: 0 }}>
        {tier.features.map((f) => (
          <li key={f} style={{ display: "flex", alignItems: "start", gap: 8, fontSize: 13.5, color: "var(--hs-ink-secondary)", lineHeight: 1.5 }}>
            <span aria-hidden style={{ color: "var(--hs-steel)", fontWeight: 700, flexShrink: 0 }}>
              ✓
            </span>
            {f}
          </li>
        ))}
      </ul>
      <style>{`
        .hs-tier-card:hover { transform: translateY(-4px); box-shadow: 0 14px 36px rgba(15,30,46,0.08); border-color: var(--hs-border); }
      `}</style>
    </div>
  );
}
