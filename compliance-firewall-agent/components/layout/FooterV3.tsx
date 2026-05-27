"use client";

import Link from "next/link";
import { useState } from "react";
import { HoundShieldLogo } from "@/components/brand/HoundShieldLogo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Changelog", href: "/changelog" },
      { label: "Demo", href: "/demo" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Partners", href: "/partners" },
      { label: "Contact", href: "/contact" },
      { label: "Security", href: "/hipaa" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "Quickstart", href: "/docs/quickstart" },
      { label: "HIPAA", href: "/hipaa" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

const BADGES = ["CMMC LVL 2", "HIPAA", "SOC 2", "NIST 800-171"];

export function FooterV3() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <footer
      style={{
        borderTop: "1px solid var(--hs-border-subtle)",
        background: "var(--hs-surface-1)",
        padding: "64px 24px 28px",
      }}
    >
      <div
        className="hs-footer-grid"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr 1.2fr",
          gap: 48,
        }}
      >
        <div>
          <HoundShieldLogo size={40} asLink={false} />
          <p style={{ margin: "14px 0 16px", fontSize: 13.5, color: "var(--hs-ink-tertiary)", maxWidth: 280, lineHeight: 1.6 }}>
            Local AI compliance for DoD contractors. CMMC · HIPAA · SOC 2.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {BADGES.map((b) => (
              <span
                key={b}
                style={{
                  fontSize: 11,
                  padding: "4px 9px",
                  borderRadius: 9999,
                  border: "1px solid var(--hs-border)",
                  background: "#fff",
                  color: "var(--hs-ink-secondary)",
                  fontWeight: 500,
                }}
              >
                {b}
              </span>
            ))}
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h5
              className="font-mono uppercase"
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.16em",
                color: "var(--hs-ink)",
                marginBottom: 14,
              }}
            >
              {col.title}
            </h5>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8, padding: 0, margin: 0 }}>
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    style={{ fontSize: 13.5, color: "var(--hs-ink-secondary)" }}
                    className="hover:text-[var(--hs-ink)] transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h5
            className="font-mono uppercase"
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.16em",
              color: "var(--hs-ink)",
              marginBottom: 14,
            }}
          >
            Get CMMC updates
          </h5>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!email) return;
              setSubmitted(true);
              setEmail("");
              window.setTimeout(() => setSubmitted(false), 3000);
            }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              aria-label="Email address"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid var(--hs-border-subtle)",
                background: "#fff",
                fontSize: 13,
                color: "var(--hs-ink)",
                marginBottom: 8,
                fontFamily: "inherit",
              }}
            />
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                background: "linear-gradient(135deg, var(--hs-steel-dark), var(--hs-steel))",
                boxShadow: "0 4px 12px rgba(90,134,168,0.25)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {submitted ? "Subscribed ✓" : "Subscribe"}
            </button>
          </form>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1200,
          margin: "48px auto 0",
          paddingTop: 24,
          borderTop: "1px solid var(--hs-border-subtle)",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: 12,
          fontSize: 12.5,
          color: "var(--hs-ink-tertiary)",
        }}
      >
        <span>© {new Date().getFullYear()} HoundShield. All rights reserved.</span>
        <div style={{ display: "flex", gap: 18 }}>
          <Link href="/privacy" className="hover:text-[var(--hs-ink)]">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-[var(--hs-ink)]">
            Terms
          </Link>
          <Link href="/hipaa" className="hover:text-[var(--hs-ink)]">
            Security
          </Link>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .hs-footer-grid { grid-template-columns: repeat(2,1fr) !important; gap: 32px !important; }
        }
      `}</style>
    </footer>
  );
}
