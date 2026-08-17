'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle, KeyRound } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { TextLogo } from '@/components/TextLogo';
import { TurnstileChallenge } from '@/components/auth/TurnstileChallenge';

/**
 * Password reset is deliberately code entry, not a recovery session or an email
 * URL. The raw code is delivered only in the email and is posted once to the
 * server-side completion route together with the new password.
 */
export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < 12 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError('Use at least 12 characters, including a letter and a number.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: code.trim().toUpperCase(), password, captchaToken: captchaToken || undefined }),
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; captchaRequired?: boolean };
      if (data.captchaRequired) {
        setCaptchaRequired(true);
        setCaptchaToken('');
        setError('');
        return;
      }
      if (!response.ok || !data.ok) {
        setError(data.error || 'This reset request is invalid, expired, or already used.');
        return;
      }
      setDone(true);
    } catch {
      setError("We couldn't reach the reset service. Please try again in a moment.");
    } finally {
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
            <Link href="/login" className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-brand-700 text-white text-sm font-semibold hover:bg-brand-800 transition-colors mt-2">
              Go to login
            </Link>
          </div>
        ) : (
          <>
            <Link href="/forgot-password" className="inline-flex items-center gap-1.5 text-xs text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)] transition-colors mb-8">
              <ArrowLeft className="w-3.5 h-3.5" />
              Request a new code
            </Link>
            <h1 className="text-xl font-bold text-[var(--hs-ink)] mb-1">Set a new password</h1>
            <p className="text-sm text-[var(--hs-ink-secondary)] mb-6">
              Enter the one-time code from your email. It expires after one hour and is never sent in a link.
            </p>

            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs" role="alert">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-xs font-medium text-[var(--hs-ink-secondary)] uppercase tracking-wider mb-1.5">Email</label>
                <input id="reset-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required className="w-full px-3 py-3 rounded-xl bg-white border border-[var(--hs-border)] text-[var(--hs-ink)] text-sm placeholder:text-[var(--hs-ink-tertiary)] focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 transition-all" />
              </div>
              <div>
                <label htmlFor="reset-code" className="block text-xs font-medium text-[var(--hs-ink-secondary)] uppercase tracking-wider mb-1.5">One-time reset code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--hs-ink-secondary)]" />
                  <input id="reset-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\s/g, '').toUpperCase())} placeholder="32-character code" autoComplete="one-time-code" inputMode="text" pattern="[A-Fa-f0-9]{32}" minLength={32} maxLength={32} required className="w-full pl-10 pr-3 py-3 rounded-xl bg-white border border-[var(--hs-border)] text-[var(--hs-ink)] font-mono text-sm tracking-wide placeholder:font-sans placeholder:tracking-normal placeholder:text-[var(--hs-ink-tertiary)] focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 transition-all" />
                </div>
              </div>
              <div>
                <label htmlFor="reset-password" className="block text-xs font-medium text-[var(--hs-ink-secondary)] uppercase tracking-wider mb-1.5">New password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--hs-ink-secondary)]" />
                  <input id="reset-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="12+ characters, letter and number" required minLength={12} maxLength={200} className="w-full pl-10 pr-12 py-3 rounded-xl bg-white border border-[var(--hs-border)] text-[var(--hs-ink)] text-sm placeholder:text-[var(--hs-ink-tertiary)] focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)]">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {captchaRequired && (
                <TurnstileChallenge
                  onToken={(token) => setCaptchaToken(token)}
                  onExpired={() => setCaptchaToken('')}
                />
              )}
              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--hs-steel-dark)] to-[var(--hs-steel)] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
