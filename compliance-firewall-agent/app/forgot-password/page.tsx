"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { HoundShieldLogo } from "@/components/brand/HoundShieldLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrMsg("");

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?redirect=/command-center`,
    });

    if (resetError) {
      setErrMsg(resetError.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "var(--hs-surface-0)",
      }}
    >
      <div className="glass-card" style={{ width: "100%", maxWidth: 420, padding: 32 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <HoundShieldLogo size={40} asLink />
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5"
          style={{ fontSize: 12, color: "var(--hs-ink-tertiary)", marginBottom: 24 }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to login
        </Link>

        {sent ? (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "rgba(112,200,140,0.12)",
                border: "1px solid rgba(112,200,140,0.30)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <CheckCircle className="w-6 h-6" style={{ color: "#3FA070" }} />
            </div>
            <h1
              className="font-display"
              style={{ fontSize: 22, fontWeight: 600, color: "var(--hs-ink)", marginBottom: 8 }}
            >
              Check your email
            </h1>
            <p style={{ fontSize: 14, color: "var(--hs-ink-secondary)", lineHeight: 1.6 }}>
              We sent a password reset link to{" "}
              <span style={{ color: "var(--hs-ink)", fontWeight: 500 }}>{email}</span>.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5"
              style={{ marginTop: 16, fontSize: 13, color: "var(--hs-steel-dark)", fontWeight: 600 }}
            >
              Return to login
            </Link>
          </div>
        ) : (
          <>
            <h1
              className="font-display"
              style={{ fontSize: 24, fontWeight: 600, color: "var(--hs-ink)", marginBottom: 6 }}
            >
              Reset your password
            </h1>
            <p style={{ fontSize: 14, color: "var(--hs-ink-secondary)", marginBottom: 20 }}>
              Enter your email and we&apos;ll send you a reset link.
            </p>

            {errMsg && (
              <div
                style={{
                  marginBottom: 14,
                  padding: 12,
                  borderRadius: 10,
                  background: "rgba(225,75,75,0.06)",
                  border: "1px solid rgba(225,75,75,0.22)",
                  color: "#9A2D2D",
                  fontSize: 12,
                }}
              >
                {errMsg}
              </div>
            )}

            <form onSubmit={handleReset} style={{ display: "grid", gap: 14 }}>
              <div>
                <label
                  className="font-mono uppercase"
                  style={{
                    display: "block",
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    color: "var(--hs-ink-tertiary)",
                    marginBottom: 6,
                  }}
                >
                  Email
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    className="w-4 h-4"
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--hs-ink-tertiary)",
                    }}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    style={{
                      width: "100%",
                      padding: "12px 14px 12px 38px",
                      borderRadius: 10,
                      border: "1px solid var(--hs-border-subtle)",
                      background: "#fff",
                      color: "var(--hs-ink)",
                      fontSize: 14,
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="text-white"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 14,
                  background: "linear-gradient(135deg, var(--hs-steel-dark), var(--hs-steel))",
                  boxShadow: "0 4px 12px rgba(90,134,168,0.25)",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  fontFamily: "inherit",
                }}
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
