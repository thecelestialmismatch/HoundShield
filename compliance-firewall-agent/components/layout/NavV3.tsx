"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, Lock, HeartPulse, Shield, Briefcase, Globe, Landmark, ArrowRight } from "lucide-react";
import { HoundShieldLogo } from "@/components/brand/HoundShieldLogo";
import { LiveCounter } from "@/components/marketing/LiveCounter";

interface IndustryItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  framework: string;
  body: string;
  saves: string;
}

const INDUSTRIES: IndustryItem[] = [
  {
    icon: <Lock className="w-5 h-5" />,
    label: "Technology",
    href: "/features",
    framework: "SOC 2 · AI Governance",
    body: "Engineers pasting API keys and source code into Copilot and ChatGPT daily.",
    saves: "Saves: Avg. $400K breach cost",
  },
  {
    icon: <HeartPulse className="w-5 h-5" />,
    label: "Healthcare",
    href: "/hipaa",
    framework: "HIPAA · 45 CFR Part 164",
    body: "Clinicians pasting patient records into AI tools for documentation and billing.",
    saves: "Saves: Avg. $1.9M HIPAA penalty",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    label: "Defense",
    href: "/features",
    framework: "CMMC Level 2 · NIST 800-171",
    body: "DoD contractors leaking CUI and contract data into AI proposal tools.",
    saves: "Saves: Avg. $150K C3PAO cost",
  },
  {
    icon: <Briefcase className="w-5 h-5" />,
    label: "Legal & Finance",
    href: "/features",
    framework: "SOC 2 · PCI DSS",
    body: "Lawyers and analysts sharing privileged client data with AI assistants.",
    saves: "Saves: Avg. $200K per breach",
  },
  {
    icon: <Globe className="w-5 h-5" />,
    label: "Five Eyes / Global",
    href: "/features",
    framework: "DISP · ASD Essential Eight",
    body: "International defence suppliers navigating AUKUS and allied frameworks.",
    saves: "Saves: DISP audit costs",
  },
  {
    icon: <Landmark className="w-5 h-5" />,
    label: "Government",
    href: "/features",
    framework: "FedRAMP · FISMA",
    body: "Federal agencies adopting AI without a compliant data handling framework.",
    saves: "Saves: Authorization costs",
  },
];

const NAV_LINKS = [
  { label: "Product", href: "/features", dropdown: "industries" as const },
  { label: "How it works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Partners", href: "/partners" },
  { label: "Docs", href: "/docs" },
  { label: "Blog", href: "/blog" },
];

export function NavV3() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 h-16 transition-colors ${scrolled ? "nav-frosted" : ""}`}
      style={!scrolled ? { background: "transparent" } : undefined}
    >
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
        <HoundShieldLogo size={36} />

        <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
          {NAV_LINKS.map((link) =>
            link.dropdown === "industries" ? (
              <div
                key={link.href}
                className="relative"
                onMouseEnter={() => setProductOpen(true)}
                onMouseLeave={() => setProductOpen(false)}
              >
                <button
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={productOpen}
                  onFocus={() => setProductOpen(true)}
                  className="inline-flex items-center gap-1 text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)] hover:bg-[var(--hs-mist)] rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                >
                  {link.label}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${productOpen ? "rotate-180" : ""}`} />
                </button>
                {productOpen && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 top-full pt-3"
                    style={{ width: 880 }}
                  >
                    <div
                      className="rounded-2xl"
                      style={{
                        background: "rgba(255,255,255,0.98)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid var(--hs-border-subtle)",
                        boxShadow: "0 24px 60px rgba(15,30,46,0.12)",
                        padding: 24,
                      }}
                    >
                      <div
                        className="font-mono uppercase mb-1"
                        style={{ fontSize: 11, letterSpacing: "0.18em", color: "var(--hs-ink-tertiary)" }}
                      >
                        Products by industry
                      </div>
                      <p style={{ fontSize: 13, color: "var(--hs-ink-tertiary)", marginBottom: 18 }}>
                        One firewall · Every compliance framework · One deployment
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {INDUSTRIES.map((it) => (
                          <Link
                            key={it.label}
                            href={it.href}
                            onClick={() => setProductOpen(false)}
                            className="block p-4 rounded-xl transition-all"
                            style={{
                              background: "#fff",
                              border: "1px solid var(--hs-border-subtle)",
                            }}
                          >
                            <div
                              className="inline-flex items-center justify-center mb-3"
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 9,
                                background: "var(--hs-mist-md)",
                                color: "var(--hs-steel-dark)",
                              }}
                            >
                              {it.icon}
                            </div>
                            <div className="flex items-center justify-between">
                              <span
                                className="font-display"
                                style={{ fontSize: 16, fontWeight: 600, color: "var(--hs-ink)", letterSpacing: "-0.01em" }}
                              >
                                {it.label}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5" style={{ color: "var(--hs-ink-tertiary)" }} />
                            </div>
                            <div
                              className="font-mono uppercase mt-1"
                              style={{ fontSize: 10, letterSpacing: "0.14em", color: "var(--hs-steel-dark)" }}
                            >
                              {it.framework}
                            </div>
                            <p style={{ fontSize: 12.5, color: "var(--hs-ink-secondary)", marginTop: 8, lineHeight: 1.5 }}>
                              {it.body}
                            </p>
                            <span
                              className="inline-block mt-3"
                              style={{
                                fontSize: 11,
                                color: "var(--hs-steel-dark)",
                                background: "var(--hs-mist-md)",
                                padding: "3px 9px",
                                borderRadius: 9999,
                                fontWeight: 600,
                              }}
                            >
                              {it.saves}
                            </span>
                          </Link>
                        ))}
                      </div>
                      <div
                        className="mt-5 pt-4 flex items-center justify-between"
                        style={{ borderTop: "1px solid var(--hs-border-subtle)" }}
                      >
                        <div style={{ fontSize: 12, color: "var(--hs-ink-tertiary)" }}>
                          SOC 2 · HIPAA · CMMC L2 · 16 detection engines · &lt;10ms
                        </div>
                        <Link
                          href="/signup"
                          onClick={() => setProductOpen(false)}
                          className="inline-flex items-center gap-1 text-sm font-semibold"
                          style={{ color: "var(--hs-steel-dark)" }}
                        >
                          Start free — all frameworks included <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)] hover:bg-[var(--hs-mist)] rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <LiveCounter />
          <Link
            href="/login"
            className="text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)] hover:bg-[var(--hs-mist)] rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, var(--hs-steel-dark), var(--hs-steel))",
              boxShadow: "0 4px 12px rgba(90,134,168,0.25)",
            }}
          >
            Start free <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="lg:hidden p-2 rounded-lg hover:bg-[var(--hs-mist)]"
          style={{ color: "var(--hs-ink)" }}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="lg:hidden absolute top-16 inset-x-0 border-t"
          style={{
            background: "rgba(250,252,255,0.97)",
            backdropFilter: "blur(20px)",
            borderColor: "var(--hs-border-subtle)",
          }}
        >
          <nav className="px-4 py-4 flex flex-col gap-1" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)] hover:bg-[var(--hs-mist)] rounded-lg px-3 py-2 text-base font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div style={{ borderTop: "1px solid var(--hs-border-subtle)", margin: "8px 0" }} />
            <div className="px-3 py-2"><LiveCounter /></div>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-base font-medium"
              style={{ color: "var(--hs-ink-secondary)" }}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-base font-semibold text-white text-center"
              style={{ background: "linear-gradient(135deg, var(--hs-steel-dark), var(--hs-steel))" }}
            >
              Start free
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
