/**
 * TwoFactorSettings — /console/security. Enable/disable email 2FA on the
 * signed-in account (Better Auth `twoFactor` plugin, email-OTP factor only).
 *
 * Enable is a three-step wizard: password → emailed code → backup codes. The
 * account flag flips ONLY after the code round-trips (see lib/auth/better-auth
 * — skipVerificationOnEnable stays false), so a broken email path can never
 * lock the user out. Backup codes are displayed exactly once, after that
 * verification.
 *
 * When Supabase is still the active provider there is no second factor to
 * manage — the page says so honestly instead of showing a dead toggle.
 *
 * Control mapping: NIST 800-171 3.5.3 (multifactor authentication) ·
 * HIPAA 164.312(d) (person or entity authentication).
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Copy, Lock, Mail, ShieldCheck, ShieldOff } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { authClient } from '@/lib/auth/auth-client';
import {
  normalizeOtpInput,
  isCompleteOtp,
  resendWaitSeconds,
  otpErrorMessage,
  OTP_LENGTH,
} from '@/lib/auth/two-factor-state';

type Step =
  | { name: 'idle' }
  | { name: 'password'; mode: 'enable' | 'disable' }
  | { name: 'verify' }
  | { name: 'codes'; backupCodes: string[] };

const card = 'rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6';
const input =
  'w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-400/60 focus:ring-1 focus:ring-brand-400/40 transition-all';
const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500/[0.16] border border-brand-400/30 px-4 py-2.5 text-sm font-semibold text-brand-100 hover:bg-brand-500/[0.24] disabled:opacity-50 disabled:cursor-not-allowed transition-colors';
const ghostBtn =
  'inline-flex items-center justify-center rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/[0.05] transition-colors';

export function TwoFactorSettings({
  email,
  betterAuthActive,
  initialEnabled,
}: {
  email: string | null;
  betterAuthActive: boolean;
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [step, setStep] = useState<Step>({ name: 'idle' });
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  // Held from enable() until the code verifies — only then shown once.
  const [pendingCodes, setPendingCodes] = useState<string[]>([]);

  const resetFlow = () => {
    setStep({ name: 'idle' });
    setPassword('');
    setOtp('');
    setError('');
    setPendingCodes([]);
  };

  const sendCode = async (): Promise<boolean> => {
    try {
      const { error: sendError } = await authClient.twoFactor.sendOtp();
      if (sendError) {
        setError(otpErrorMessage(sendError.code, sendError.message));
        return false;
      }
    } catch {
      setError("We couldn't send the code. Please try again in a moment.");
      return false;
    }
    setLastSentAt(Date.now());
    return true;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step.name !== 'password') return;
    setError('');
    setBusy(true);
    try {
      if (step.mode === 'disable') {
        const { error: err } = await authClient.twoFactor.disable({ password });
        if (err) {
          setError(otpErrorMessage(err.code, err.message));
        } else {
          setEnabled(false);
          resetFlow();
        }
        return;
      }
      const { data, error: err } = await authClient.twoFactor.enable({ password });
      if (err) {
        setError(otpErrorMessage(err.code, err.message));
        return;
      }
      setPendingCodes(data?.backupCodes ?? []);
      setPassword('');
      if (await sendCode()) setStep({ name: 'verify' });
    } catch {
      setError("We couldn't reach the auth service. Please try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCompleteOtp(otp)) {
      setError(`Enter the ${OTP_LENGTH}-digit code from your email.`);
      return;
    }
    setError('');
    setBusy(true);
    try {
      const { error: err } = await authClient.twoFactor.verifyOtp({ code: otp });
      if (err) {
        setError(otpErrorMessage(err.code, err.message));
        return;
      }
      setEnabled(true);
      setOtp('');
      setStep({ name: 'codes', backupCodes: pendingCodes });
      setPendingCodes([]);
    } catch {
      setError("We couldn't verify the code. Please try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (resendWaitSeconds(lastSentAt, Date.now()) > 0) return;
    setError('');
    setOtp('');
    await sendCode();
  };

  const copyCodes = async (codes: string[]) => {
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions/HTTP) — codes stay visible to copy by hand.
    }
  };

  return (
    <div className="dark min-h-screen bg-[#08090e] text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#08090e]/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Logo size={26} variant="dark" />
            <div>
              <p className="text-sm font-bold tracking-wide">Account Security</p>
              <p className="text-[11px] text-slate-500">{email ?? 'Signed in'}</p>
            </div>
          </div>
          <Link
            href="/console"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Command Center
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-2xl font-bold">Two-factor authentication</h1>
        <p className="mt-1 mb-8 text-sm text-slate-400">
          A sign-in code emailed to you on every new device — a second lock on the account that
          holds your audit evidence. Maps to NIST 800-171 3.5.3 and HIPAA 164.312(d).
        </p>

        {!betterAuthActive ? (
          <div className={card}>
            <div className="flex items-start gap-3">
              <ShieldOff className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
              <div>
                <p className="text-sm font-semibold">Not available yet on this account</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">
                  Email two-factor authentication ships with HoundShield&apos;s self-hosted auth
                  provider, which isn&apos;t active for your account yet. It turns on automatically
                  once your workspace is migrated — no action needed from you.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className={card}>
            {error && (
              <p className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            {step.name === 'idle' && (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    className={`mt-0.5 h-5 w-5 shrink-0 ${enabled ? 'text-emerald-400' : 'text-slate-500'}`}
                  />
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      Email sign-in codes
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider ${
                          enabled
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-white/[0.06] text-slate-400'
                        }`}
                      >
                        {enabled ? 'ON' : 'OFF'}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {enabled
                        ? 'Signing in on a new device requires a code from your email.'
                        : 'Your password is currently the only lock on this account.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className={enabled ? ghostBtn : primaryBtn}
                  onClick={() =>
                    setStep({ name: 'password', mode: enabled ? 'disable' : 'enable' })
                  }
                >
                  {enabled ? 'Turn off' : 'Turn on'}
                </button>
              </div>
            )}

            {step.name === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <p className="text-sm font-semibold">
                  {step.mode === 'enable'
                    ? 'Confirm your password to turn on 2FA'
                    : 'Confirm your password to turn off 2FA'}
                </p>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Current password"
                    autoFocus
                    required
                    className={`${input} pl-10`}
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={busy || !password} className={primaryBtn}>
                    {step.mode === 'enable' ? 'Continue' : 'Turn off 2FA'}
                  </button>
                  <button type="button" onClick={resetFlow} className={ghostBtn}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {step.name === 'verify' && (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-brand-100" />
                  <div>
                    <p className="text-sm font-semibold">Check your email</p>
                    <p className="mt-1 text-sm text-slate-400">
                      We sent a {OTP_LENGTH}-digit code{email ? ` to ${email}` : ''}. Entering it
                      proves the email loop works before 2FA locks in.
                    </p>
                  </div>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(normalizeOtpInput(e.target.value))}
                  placeholder="000000"
                  autoFocus
                  required
                  className={`${input} font-mono text-lg tracking-[0.4em] placeholder:tracking-[0.4em]`}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="submit"
                    disabled={busy || !isCompleteOtp(otp)}
                    className={primaryBtn}
                  >
                    Verify &amp; enable
                  </button>
                  <button type="button" onClick={handleResend} className={ghostBtn}>
                    Resend code
                  </button>
                  <button type="button" onClick={resetFlow} className={ghostBtn}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {step.name === 'codes' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <div>
                    <p className="text-sm font-semibold">Two-factor authentication is on</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Save these one-time backup codes somewhere safe — each works once if you
                      ever lose access to your email. This is the only time they&apos;re shown.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 font-mono text-sm text-slate-200 sm:grid-cols-3">
                  {step.backupCodes.length > 0 ? (
                    step.backupCodes.map((c) => <span key={c}>{c}</span>)
                  ) : (
                    <span className="col-span-full text-slate-500">
                      No backup codes returned — you can regenerate them by turning 2FA off and
                      on again.
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {step.backupCodes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => copyCodes(step.backupCodes)}
                      className={primaryBtn}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Copied' : 'Copy codes'}
                    </button>
                  )}
                  <button type="button" onClick={resetFlow} className={ghostBtn}>
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="mt-6 text-xs leading-relaxed text-slate-500">
          Codes expire after 5 minutes and lock out after repeated failures. &ldquo;Trust this
          device&rdquo; at sign-in skips the code on that browser for 30 days.
        </p>
      </main>
    </div>
  );
}
