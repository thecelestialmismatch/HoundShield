import Image from "next/image";
import Link from "next/link";

/* ────────────────────────────────────────────────────────────
   HoundShield Landing Page v3
   Mirrors the Claude Design reference (HoundShield Landing
   Page v3.html). Uses --hs-* CSS variables defined in globals.css.
   Server Component — no client JS for the landing surface itself.
   ──────────────────────────────────────────────────────────── */

const FEATURES = [
  {
    title: "100% Local Scanning",
    body: "Every prompt is inspected on your network, before it leaves. Zero data egress, zero telemetry, zero exposure.",
  },
  {
    title: "C3PAO-Ready PDF Reports",
    body: "Tamper-evident audit logs export to a signed PDF mapped to NIST 800-171 controls — the artifact your assessor accepts.",
  },
  {
    title: "Zero-Friction Deployment",
    body: "One URL change. Works with ChatGPT, Copilot, Claude, Gemini, and any OpenAI-compatible endpoint. Docker in 10 minutes.",
  },
  {
    title: "OODA Behavioral Engine",
    body: "Self-correcting agent loop (Observe → Orient → Decide → Act) tunes detection thresholds against your own audit cadence.",
  },
  {
    title: "16 CUI Detection Patterns",
    body: "CUI//SP-CTI, ITAR, CAGE codes, clearance levels, contract numbers, PHI, PII, secrets — all pre-loaded, all editable.",
  },
  {
    title: "Brain AI Compliance Advisor",
    body: "Ask plain-English compliance questions. Mapped to NIST 800-171 Rev 2 controls with citation, with consent-gated CUI handling.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Change one URL",
    body: "Point your team's AI tools at the HoundShield proxy. No agents, no extensions, no per-user installation.",
  },
  {
    n: "02",
    title: "Every prompt scanned locally",
    body: "<10ms classification. 16 detection patterns. Blocked prompts never leave your control boundary.",
  },
  {
    n: "03",
    title: "Audit PDF on demand",
    body: "Generate a signed, hash-chained NIST 800-171 evidence pack the moment your C3PAO asks for it.",
  },
];

const PRICING = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    note: "Up to 1,000 prompts / month",
    cta: "Get Started Free",
    href: "/signup",
    primary: false,
  },
  {
    name: "Pro",
    price: "$199",
    cadence: "/ month",
    note: "SOC 2 + HIPAA coverage · 50k prompts",
    cta: "Start Free Trial",
    href: "/signup?plan=pro",
    primary: true,
  },
  {
    name: "Growth",
    price: "$499",
    cadence: "/ month",
    note: "PDF reports · 250k prompts · 5 admins",
    cta: "Start Free Trial",
    href: "/signup?plan=growth",
    primary: false,
  },
  {
    name: "Enterprise",
    price: "$999",
    cadence: "/ month",
    note: "Unlimited prompts · CMMC L2 · SSO",
    cta: "Talk to Sales",
    href: "/contact",
    primary: false,
  },
  {
    name: "Agency",
    price: "$2,499",
    cadence: "/ month",
    note: "White-label · multi-tenant · MSP",
    cta: "Talk to Sales",
    href: "/contact",
    primary: false,
  },
];

const FOOTER_COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "How It Works", href: "/#how-it-works" },
      { label: "Changelog", href: "/changelog" },
      { label: "Roadmap", href: "/docs" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/contact" },
      { label: "Press", href: "/contact" },
      { label: "Security", href: "/security" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "API Reference", href: "/docs" },
      { label: "CMMC Guide", href: "/blog" },
      { label: "DFARS 7012 FAQ", href: "/blog" },
      { label: "C3PAO Finder", href: "/partners" },
    ],
  },
];

export function HomeV3() {
  return (
    <main style={{ background: "var(--hs-surface-0)", color: "var(--hs-ink)", fontFamily: "var(--font-dm-sans)" }}>
      {/* ── NAV ───────────────────────────────────────────────── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(250, 252, 255, 0.85)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid var(--hs-border-subtle)",
        }}
      >
        <div
          style={{
            maxWidth: 1240,
            margin: "0 auto",
            padding: "14px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <Image src="/houndshield-logo.png" alt="HoundShield" width={32} height={32} priority />
            <span
              style={{
                fontFamily: "var(--font-fraunces)",
                fontSize: 22,
                fontWeight: 600,
                color: "var(--hs-ink)",
                letterSpacing: "-0.01em",
              }}
            >
              HoundShield
            </span>
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: 28 }}>
            {[
              { label: "Product", href: "/features" },
              { label: "How It Works", href: "/#how-it-works" },
              { label: "Pricing", href: "/pricing" },
              { label: "Docs", href: "/docs" },
            ].map((l) => (
              <Link
                key={l.label}
                href={l.href}
                style={{
                  color: "var(--hs-ink-tertiary)",
                  textDecoration: "none",
                  fontSize: 13.5,
                  fontWeight: 400,
                  transition: "color 0.15s",
                }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href="/login"
              style={{
                color: "var(--hs-ink-secondary)",
                textDecoration: "none",
                fontSize: 13.5,
                fontWeight: 500,
              }}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 18px",
                background: "var(--hs-steel)",
                color: "white",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-cta)",
                transition: "background 0.15s",
              }}
            >
              Start Free
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section style={{ padding: "96px 28px 120px", background: "var(--hs-surface-0)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: "var(--radius-pill)",
              background: "var(--hs-mist)",
              border: "1px solid var(--hs-border)",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--hs-ink-secondary)",
              marginBottom: 28,
              letterSpacing: "0.01em",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--hs-success)",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
            CMMC Level 2 enforcement — Nov 10, 2026
          </div>

          <h1
            style={{
              fontFamily: "var(--font-fraunces)",
              fontSize: "clamp(48px, 5.5vw, 72px)",
              lineHeight: 1.04,
              color: "var(--hs-ink)",
              letterSpacing: "-0.02em",
              margin: "0 0 28px",
              fontWeight: 400,
              fontOpticalSizing: "auto",
            }}
          >
            Stop your team from leaking <em style={{ fontStyle: "italic", color: "var(--hs-steel-dark)" }}>CUI</em> to ChatGPT.
          </h1>

          <p
            style={{
              fontSize: 18,
              lineHeight: 1.6,
              color: "var(--hs-ink-secondary)",
              maxWidth: 680,
              margin: "0 auto 40px",
              fontWeight: 400,
            }}
          >
            Local-only AI compliance firewall for DoD contractors. Intercepts CUI before it leaves your network.
            CMMC Level 2, DFARS 7012, SOC 2. &lt;10ms latency. One URL to deploy.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", marginBottom: 56 }}>
            <Link
              href="/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 28px",
                background: "var(--hs-steel)",
                color: "white",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-cta)",
                transition: "all 0.15s",
              }}
            >
              Deploy in 10 minutes →
            </Link>
            <Link
              href="/contact"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 28px",
                background: "transparent",
                color: "var(--hs-ink)",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
                border: "1px solid var(--hs-border-strong)",
                borderRadius: "var(--radius-md)",
                transition: "all 0.15s",
              }}
            >
              Book a demo
            </Link>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 36,
              flexWrap: "wrap",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--hs-ink-tertiary)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontFamily: "var(--font-jetbrains)",
            }}
          >
            <span>● NIST 800-171 Rev 2</span>
            <span>● DFARS 252.204-7012</span>
            <span>● CMMC Level 2</span>
            <span>● SHA-256 Hash-Chained</span>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section style={{ padding: "96px 28px", background: "var(--hs-surface-1)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <p
              style={{
                fontFamily: "var(--font-jetbrains)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--hs-steel-dark)",
                marginBottom: 16,
              }}
            >
              Built for ISSO / ISSM
            </p>
            <h2
              style={{
                fontFamily: "var(--font-fraunces)",
                fontSize: 44,
                lineHeight: 1.1,
                color: "var(--hs-ink)",
                letterSpacing: "-0.02em",
                margin: 0,
                fontWeight: 400,
              }}
            >
              Everything your audit demands.
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 24,
            }}
          >
            {FEATURES.map((f) => (
              <article
                key={f.title}
                style={{
                  padding: "28px 24px",
                  background: "var(--hs-white)",
                  border: "1px solid var(--hs-border-subtle)",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "var(--shadow-sm)",
                  transition: "all 0.2s var(--ease-out)",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "var(--radius-sm)",
                    background: "var(--hs-mist)",
                    border: "1px solid var(--hs-border)",
                    marginBottom: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--hs-steel)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: 17,
                    fontWeight: 600,
                    color: "var(--hs-ink)",
                    margin: "0 0 8px",
                    lineHeight: 1.25,
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    color: "var(--hs-ink-tertiary)",
                    margin: 0,
                  }}
                >
                  {f.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (DARK NAVY) ──────────────────────────── */}
      <section
        id="how-it-works"
        style={{
          padding: "96px 28px",
          background: "var(--hs-navy)",
          color: "var(--hs-white)",
        }}
      >
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 72 }}>
            <p
              style={{
                fontFamily: "var(--font-jetbrains)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--hs-sky)",
                marginBottom: 16,
              }}
            >
              How it works
            </p>
            <h2
              style={{
                fontFamily: "var(--font-fraunces)",
                fontSize: 44,
                lineHeight: 1.1,
                color: "var(--hs-white)",
                letterSpacing: "-0.02em",
                margin: 0,
                fontWeight: 400,
              }}
            >
              From URL change to audit PDF in three steps.
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 32,
            }}
          >
            {STEPS.map((s) => (
              <div
                key={s.n}
                style={{
                  padding: "32px 28px",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(170, 205, 220, 0.18)",
                  borderRadius: "var(--radius-lg)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-jetbrains)",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--hs-steel-light)",
                    letterSpacing: "0.1em",
                  }}
                >
                  {s.n}
                </span>
                <h3
                  style={{
                    fontFamily: "var(--font-fraunces)",
                    fontWeight: 400,
                    fontSize: 24,
                    color: "var(--hs-white)",
                    margin: "12px 0 14px",
                    fontOpticalSizing: "auto",
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.65,
                    color: "rgba(250, 252, 255, 0.7)",
                    margin: 0,
                  }}
                >
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────── */}
      <section style={{ padding: "96px 28px", background: "var(--hs-surface-0)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p
              style={{
                fontFamily: "var(--font-jetbrains)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--hs-steel-dark)",
                marginBottom: 16,
              }}
            >
              Pricing
            </p>
            <h2
              style={{
                fontFamily: "var(--font-fraunces)",
                fontSize: 44,
                lineHeight: 1.1,
                color: "var(--hs-ink)",
                letterSpacing: "-0.02em",
                margin: "0 0 12px",
                fontWeight: 400,
              }}
            >
              Simple, transparent pricing.
            </h2>
            <p style={{ fontSize: 15, color: "var(--hs-ink-tertiary)", margin: 0 }}>
              Every framework included. No per-user fees. Cancel anytime.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {PRICING.map((t) => (
              <div
                key={t.name}
                style={{
                  padding: 24,
                  background: t.primary ? "var(--hs-white)" : "var(--hs-white)",
                  border: `1px solid ${t.primary ? "var(--hs-steel)" : "var(--hs-border-subtle)"}`,
                  borderRadius: "var(--radius-lg)",
                  boxShadow: t.primary ? "var(--shadow-md)" : "var(--shadow-sm)",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                {t.primary && (
                  <span
                    style={{
                      position: "absolute",
                      top: -10,
                      right: 16,
                      padding: "3px 10px",
                      background: "var(--hs-steel)",
                      color: "white",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      borderRadius: "var(--radius-pill)",
                    }}
                  >
                    Recommended
                  </span>
                )}
                <h3
                  style={{
                    fontFamily: "var(--font-fraunces)",
                    fontWeight: 400,
                    fontSize: 20,
                    color: "var(--hs-ink)",
                    margin: "0 0 4px",
                    fontOpticalSizing: "auto",
                  }}
                >
                  {t.name}
                </h3>
                <div style={{ marginBottom: 16 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-fraunces)",
                      fontSize: 34,
                      fontWeight: 400,
                      color: "var(--hs-ink)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {t.price}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--hs-ink-tertiary)", marginLeft: 6 }}>{t.cadence}</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--hs-ink-secondary)", margin: "0 0 24px", lineHeight: 1.5, flex: 1 }}>
                  {t.note}
                </p>
                <Link
                  href={t.href}
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "10px",
                    borderRadius: "var(--radius-sm)",
                    background: t.primary ? "var(--hs-steel)" : "transparent",
                    border: `1px solid ${t.primary ? "var(--hs-steel)" : "var(--hs-border)"}`,
                    color: t.primary ? "white" : "var(--hs-ink)",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 600,
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                >
                  {t.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA STRIP ─────────────────────────────────────────── */}
      <section style={{ padding: "80px 28px", background: "var(--hs-surface-2)" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", textAlign: "center" }}>
          <h2
            style={{
              fontFamily: "var(--font-fraunces)",
              fontSize: 38,
              lineHeight: 1.12,
              color: "var(--hs-ink)",
              letterSpacing: "-0.02em",
              margin: "0 0 20px",
              fontWeight: 400,
            }}
          >
            Ship the audit, not the spreadsheet.
          </h2>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.6,
              color: "var(--hs-ink-secondary)",
              margin: "0 auto 36px",
              maxWidth: 560,
            }}
          >
            Hand your C3PAO a hash-chained PDF. Hand your team a proxy. Keep your CUI inside your boundary.
          </p>
          <Link
            href="/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "16px 32px",
              background: "var(--hs-ink)",
              color: "white",
              textDecoration: "none",
              fontSize: 15,
              fontWeight: 600,
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            Start the 14-day audit pack →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer style={{ padding: "64px 28px 40px", background: "var(--hs-white)", borderTop: "1px solid var(--hs-border-subtle)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr repeat(3, 1fr)",
              gap: 32,
              marginBottom: 48,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <Image src="/houndshield-logo.png" alt="HoundShield" width={28} height={28} />
                <span
                  style={{
                    fontFamily: "var(--font-fraunces)",
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--hs-ink)",
                  }}
                >
                  HoundShield
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--hs-ink-tertiary)", lineHeight: 1.55, margin: 0, maxWidth: 280 }}>
                Local-only AI compliance firewall for DoD contractors, healthcare, and regulated industries.
              </p>
            </div>
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.heading}>
                <h4
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: "var(--hs-ink)",
                    margin: "0 0 14px",
                    letterSpacing: "0.01em",
                  }}
                >
                  {col.heading}
                </h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        style={{
                          color: "var(--hs-ink-tertiary)",
                          textDecoration: "none",
                          fontSize: 13,
                          transition: "color 0.15s",
                        }}
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div
            style={{
              paddingTop: 24,
              borderTop: "1px solid var(--hs-border-subtle)",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
            }}
          >
            <span style={{ fontSize: 12, color: "var(--hs-ink-tertiary)" }}>
              © {new Date().getFullYear()} HoundShield. All rights reserved.
            </span>
            <div style={{ display: "flex", gap: 18 }}>
              {["Privacy Policy", "Security", "Terms", "Cookie Policy"].map((l) => (
                <Link
                  key={l}
                  href="/security"
                  style={{ fontSize: 12, color: "var(--hs-ink-tertiary)", textDecoration: "none", whiteSpace: "nowrap" }}
                >
                  {l}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
