"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";
import { Logo } from "@/components/Logo";
import { TextLogo } from "@/components/TextLogo";

/**
 * Reset password (Better Auth). The emailed link lands here as
 * /reset-password?token=… (or ?error=INVALID_TOKEN when expired/used). We take
 * the new password and call authClient.resetPassword({ newPassword, token }).
 * useSearchParams must sit behind Suspense in the App Router.
 */
function ResetPasswordInner() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const tokenError = params.get("error"); // e.g. INVALID_TOKEN

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const invalid = !token || tokenError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const { error: resetError } = await authClient.resetPassword({ newPassword: password, token });
      if (resetError) {
        setError(resetError.message || "This reset link is invalid or has expired.");
        setLoading(false);
        return;
      }
      setDone(true);
    } catch {
      setError("We couldn't reach the reset service. Please try again in a moment.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="group/brand flex items-center justify-center gap-2.5 mb-8">
          <Logo size={36} />
          <TextLogo />
        </div>

        {done ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[rgba(5,150,105,0.1)] border border-[rgba(5,150,105,0.2)] flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6 text-[var(--hs-success)]" />
            </div>
            <h1 className="text-xl font-bold text-[var(--hs-ink)]">Password updated</h1>
            <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed">
              Your password has been reset. You can now sign in with your new password.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-brand-700 text-white text-sm font-semibold hover:bg-brand-800 transition-colors mt-2"
            >
              Go to login
            </Link>
          </div>
        ) : invalid ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-[var(--hs-ink)]">Link expired</h1>
            <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed">
              This password reset link is invalid or has already been used. Request a fresh one.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-brand-700 text-white text-sm font-semibold hover:bg-brand-800 transition-colors mt-2"
            >
              Request a new link
            </Link>
          </div>
        ) : (
          <>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)] transition-colors mb-8"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to login
            </Link>
            <h1 className="text-xl font-bold text-[var(--hs-ink)] mb-1">Set a new password</h1>
            <p className="text-sm text-[var(--hs-ink-secondary)] mb-6">
              Choose a strong password — at least 8 characters.
            </p>

            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--hs-ink-secondary)] uppercase tracking-wider mb-1.5">
                  New password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--hs-ink-secondary)]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    className="w-full pl-10 pr-12 py-3 rounded-xl bg-white border border-[var(--hs-border)] text-[var(--hs-ink)] text-sm placeholder:text-[var(--hs-ink-tertiary)] focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--hs-steel-dark)] to-[var(--hs-steel)] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
