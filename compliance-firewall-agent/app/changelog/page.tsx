import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/PublicShell";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";

export const metadata: Metadata = {
  title: "Changelog — What shipped",
  description: "Every HoundShield release, dated, with the controls and detection patterns it touched.",
};

interface ChangelogEntry {
  date: string;
  version: string;
  badge?: string;
  items: string[];
}

const ENTRIES: ChangelogEntry[] = [
  {
    date: "2026-05-27",
    version: "v0.4.0",
    badge: "Brand",
    items: [
      "Sitewide brand refresh: steel-blue + cream palette, Fraunces serif headlines, doberman-shield logo, unified PublicShell across all public pages",
      "NavV3 with industry mega-menu dropdown (hover Product → see Tech / Healthcare / Defense / Legal / Five Eyes / Government)",
      "Live intercept counter pill (+1..+3 every 4s) in nav",
      "Hero now embeds inline DashboardPreview with live scan-log feed (BLOCKED/PASSED rows append every 2.2s)",
    ],
  },
  {
    date: "2026-05-26",
    version: "v0.3.2",
    badge: "Architecture",
    items: [
      "Brain AI CUI consent gate + persistent warning banner + system prompt scrub",
      "Mode A/B/C disclaimer on homepage clarifying CUI-safety boundaries",
      "GHCR multi-arch publish workflow with cosign keyless OIDC + SBOM",
    ],
  },
  {
    date: "2026-05-20",
    version: "v0.3.0",
    badge: "Compliance",
    items: [
      "$499 one-time CMMC AI Risk Report as Stage-1 lead product",
      "Partners → /partners RPO pivot — co-branded reports at $299 wholesale",
      "16-pattern detector hardened: ITAR, CAGE, contract-numbers, FOUO, ISO export codes",
    ],
  },
  {
    date: "2026-05-08",
    version: "v0.2.0",
    badge: "Detection",
    items: [
      "OODA behavioral engine — detect repeat attempts, score policy drift",
      "SHA-256 hash chain on audit log — tamper-proof, court-grade",
      "C3PAO-ready PDF generator with 110 NIST 800-171 Rev 2 control citations",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <PublicShell>
      <section className="spotlight" style={{ position: "relative", padding: "128px 24px 32px", overflow: "hidden" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <SectionEyebrow>Changelog</SectionEyebrow>
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(36px,5vw,56px)",
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--hs-ink)",
              margin: "16px 0 24px",
            }}
          >
            What we shipped.
          </h1>
          <p style={{ fontSize: 17, color: "var(--hs-ink-secondary)" }}>
            Every release, dated, with the controls and detection patterns it touched.
          </p>
        </div>
      </section>

      <section className="spotlight" style={{ position: "relative", padding: "32px 24px 96px", overflow: "hidden" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", position: "relative", zIndex: 2, display: "grid", gap: 24 }}>
          {ENTRIES.map((e) => (
            <article key={e.version} className="glass-card" style={{ padding: 28 }}>
              <header
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 14,
                }}
              >
                <span
                  className="font-mono"
                  style={{ fontSize: 12, color: "var(--hs-ink-tertiary)", letterSpacing: "0.05em" }}
                >
                  {e.date}
                </span>
                <span
                  className="font-mono uppercase"
                  style={{
                    padding: "3px 9px",
                    borderRadius: 9999,
                    background: "var(--hs-mist-md)",
                    color: "var(--hs-steel-dark)",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                  }}
                >
                  {e.version}
                </span>
                {e.badge && (
                  <span
                    className="font-mono uppercase"
                    style={{
                      padding: "3px 9px",
                      borderRadius: 9999,
                      background: "var(--hs-surface-2)",
                      color: "var(--hs-ink)",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                    }}
                  >
                    {e.badge}
                  </span>
                )}
              </header>
              <ul style={{ listStyle: "none", display: "grid", gap: 8, padding: 0, margin: 0 }}>
                {e.items.map((it) => (
                  <li
                    key={it}
                    style={{ display: "flex", alignItems: "start", gap: 10, fontSize: 14.5, color: "var(--hs-ink-secondary)", lineHeight: 1.6 }}
                  >
                    <span style={{ color: "var(--hs-steel)", fontWeight: 700 }} aria-hidden>
                      ✓
                    </span>
                    {it}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
