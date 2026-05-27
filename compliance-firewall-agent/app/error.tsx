"use client";

import { useEffect } from "react";
import Link from "next/link";
import { PublicShell } from "@/components/layout/PublicShell";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Unhandled error in route:", error);
  }, [error]);

  return (
    <PublicShell>
      <section
        style={{
          padding: "160px 24px 120px",
          maxWidth: 720,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <SectionEyebrow>500 — Something went wrong</SectionEyebrow>
        <h1
          className="font-display"
          style={{
            fontSize: "clamp(36px,5vw,56px)",
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "var(--hs-ink)",
            margin: "16px 0 16px",
          }}
        >
          Something broke on our end.
        </h1>
        <p style={{ fontSize: 17, color: "var(--hs-ink-secondary)", marginBottom: 32 }}>
          The error was logged. You can retry, or head back home.
        </p>
        {error.digest && (
          <p
            className="font-mono"
            style={{ fontSize: 12, color: "var(--hs-ink-tertiary)", marginBottom: 24 }}
          >
            Reference: {error.digest}
          </p>
        )}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={reset}
            type="button"
            className="text-white inline-flex items-center gap-2"
            style={{
              padding: "11px 18px",
              borderRadius: 10,
              fontWeight: 600,
              background: "linear-gradient(135deg, var(--hs-steel-dark), var(--hs-steel))",
              boxShadow: "0 4px 12px rgba(90,134,168,0.25)",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Try again
          </button>
          <Link
            href="/"
            style={{
              padding: "11px 18px",
              borderRadius: 10,
              fontWeight: 600,
              color: "var(--hs-ink)",
              border: "1px solid var(--hs-border)",
              background: "#fff",
            }}
          >
            Home
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
