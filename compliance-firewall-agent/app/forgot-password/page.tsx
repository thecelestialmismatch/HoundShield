"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { authClient, isBetterAuthClientEnabled } from "@/lib/auth/auth-client";
import { Logo } from "@/components/Logo";
import { TextLogo } from "@/components/TextLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Better Auth path: emails a single-use token linking to /reset-password.
    // It intentionally reports success even for unknown emails (no account
    // enumeration), so we always show the "check your email" state.
    if (isBetterAuthClientEnabled()) {
      try {
        await authClient.requestPasswordReset({
          email,
          redirectTo: `${window.location.origin}/reset-password`,
        });
        setSent(true);
      } catch {
        setError("We couldn't reach the reset service. Please try again in a moment.");
      }
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      // Land on /reset-password to actually SET a new password. /auth/callback
      // exchanges the recovery code into a session, then forwards here — it must
      // NOT drop the user on /console (that logged them in and skipped the
      // password step entirely, the "reset link goes straight to the homepage"
      // bug). /reset-password reads that recovery session and updates the password.
      redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(
        "/reset-password",
      )}`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="group/brand flex items-center justify-center gap-2.5 mb-8">
          <Logo size={36} />
          <TextLogo />
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)] transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to login
        </Link>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[rgba(5,150,105,0.1)] border border-[rgba(5,150,105,0.2)] flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6 text-[var(--hs-success)]" />
            </div>
            <h1 className="text-xl font-bold text-[var(--hs-ink)]">Check your email</h1>
            <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed">
              We sent a password reset link to{" "}
              <span className="text-[var(--hs-ink-secondary)] font-medium">{email}</span>.
              <br />
              Click the link in the email to reset your password.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:text-brand-700 transition-colors mt-4"
            >
              Return to login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-[var(--hs-ink)] mb-1">Reset your password</h1>
            <p className="text-sm text-[var(--hs-ink-secondary)] mb-6">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--hs-ink-secondary)] uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--hs-ink-secondary)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[var(--hs-border)] text-[var(--hs-ink)] text-sm placeholder:text-[var(--hs-ink-tertiary)] focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--hs-steel-dark)] to-[var(--hs-steel)] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
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
