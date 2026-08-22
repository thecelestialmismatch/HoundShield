/**
 * The two skins the scanner wears.
 *
 * The SAME component tree renders on the public light landing page and inside
 * the dark Command Center, because they are the same feature and a customer who
 * ran the free scan should recognise it after logging in. Only tokens differ.
 *
 * `glass-card`, `btn-primary` and `btn-ghost` are deliberately absent here:
 * both themes already share them, and re-declaring them per theme is how the
 * two skins would drift apart.
 *
 * Every value below is an EXISTING token lifted from the surface it belongs to
 * — the light set from the landing components, the dark set from the dashboard
 * scanner this feature replaces. No new colour is introduced, which is what
 * keeps each surface identical to the pages around it.
 */
export type ScanTheme = "light" | "dark";

export interface ScanTokens {
  ink: string;
  inkSecondary: string;
  inkTertiary: string;
  border: string;
  /** Text input / textarea background. */
  inputBg: string;
  /** Inset panel background, one step off the card. */
  subtleBg: string;
  /** Brand accent. Landing uses brand-700; the dashboard uses brand gold 400. */
  accent: string;
  /** Monospace body text (the redacted preview). */
  mono: string;
}

export const SCAN_TOKENS: Record<ScanTheme, ScanTokens> = {
  light: {
    ink: "text-[var(--hs-ink)]",
    inkSecondary: "text-[var(--hs-ink-secondary)]",
    inkTertiary: "text-[var(--hs-ink-tertiary)]",
    border: "border-[var(--hs-border)]",
    inputBg: "bg-white",
    subtleBg: "bg-[var(--hs-mist)]",
    accent: "text-brand-700",
    mono: "text-[var(--hs-ink)]",
  },
  dark: {
    ink: "text-white",
    inkSecondary: "text-slate-300",
    inkTertiary: "text-slate-400",
    border: "border-white/10",
    inputBg: "bg-white/[0.03]",
    subtleBg: "bg-white/[0.03]",
    accent: "text-brand-400",
    mono: "text-slate-200",
  },
};

/** Severity styling, per theme. Risk colour is meaning, so it stays legible in both. */
export function severityStyle(
  risk: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE",
  theme: ScanTheme,
): { badge: string; dot: string } {
  if (risk === "CRITICAL") {
    return theme === "light"
      ? { badge: "bg-rose-500/15 text-rose-600 border-rose-500/30", dot: "bg-rose-500" }
      : { badge: "bg-rose-500/15 text-rose-300 border-rose-500/30", dot: "bg-rose-500" };
  }
  if (risk === "HIGH") {
    return theme === "light"
      ? { badge: "bg-brand-500/15 text-brand-700 border-brand-500/30", dot: "bg-brand-500" }
      : { badge: "bg-brand-500/15 text-brand-300 border-brand-500/30", dot: "bg-brand-500" };
  }
  return theme === "light"
    ? {
        badge: "bg-[var(--hs-mist)] text-[var(--hs-ink-secondary)] border-[var(--hs-border)]",
        dot: "bg-[var(--hs-steel)]",
      }
    : { badge: "bg-white/[0.06] text-slate-300 border-white/10", dot: "bg-slate-500" };
}
