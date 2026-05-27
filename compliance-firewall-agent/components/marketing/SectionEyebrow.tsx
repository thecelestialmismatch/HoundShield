interface SectionEyebrowProps {
  children: React.ReactNode;
  className?: string;
  /** Override colour (defaults to var(--hs-steel-dark); use 'sky' on dark sections). */
  variant?: "steel" | "sky" | "muted";
}

export function SectionEyebrow({ children, className = "", variant = "steel" }: SectionEyebrowProps) {
  const color =
    variant === "sky"
      ? "var(--hs-sky)"
      : variant === "muted"
      ? "var(--hs-ink-tertiary)"
      : "var(--hs-steel-dark)";

  return (
    <div
      className={`font-mono uppercase ${className}`}
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.18em",
        color,
      }}
    >
      {children}
    </div>
  );
}
