'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ScrollProgressBar } from '@/components/scroll-effects';
import { Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { authClient, isBetterAuthClientEnabled } from '@/lib/auth/auth-client';
import {
  needsSecondFactor,
  normalizeOtpInput,
  isCompleteOtp,
  resendWaitSeconds,
  otpErrorMessage,
  OTP_LENGTH,
} from '@/lib/auth/two-factor-state';
import { Logo } from '@/components/Logo';
import { TextLogo } from '@/components/TextLogo';
import { AuthTabs } from '@/components/auth/AuthTabs';
import { PasswordlessSignIn } from './PasswordlessSignIn';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Only honour same-origin relative paths — blocks open-redirect abuse.
  const rawRedirect = searchParams.get('redirect');
  const redirect =
    rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : '/console';
  // Same-origin redirect target carried across the Sign in / Sign up toggle
  // (undefined when there is no explicit redirect, so the links stay clean).
  const redirectParam =
    rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : undefined;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Surface auth-callback failures (app/auth/callback redirects here with
  // ?error=auth_failed when the OAuth code exchange fails).
  const [error, setError] = useState(
    searchParams.get('error') === 'auth_failed'
      ? 'Sign-in could not be completed. Please try again.'
      : '',
  );
  const [loading, setLoading] = useState(false);
  // Supabase passwordless (email code / magic link) — swaps in over the password form.
  const [passwordless, setPasswordless] = useState(false);

  // Email 2FA (Better Auth only): after a correct password on a 2FA-enabled
  // account, the page swaps to a code-entry step in place — no redirect.
  const [step, setStep] = useState<'credentials' | 'code'>('credentials');
  const [otp, setOtp] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [resendWait, setResendWait] = useState(0);

  // Tick the resend cooldown down once a second while it's running.
  useEffect(() => {
    if (resendWait <= 0) return;
    const id = setInterval(() => {
      setResendWait(resendWaitSeconds(lastSentAt, Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [resendWait, lastSentAt]);

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
    const now = Date.now();
    setLastSentAt(now);
    setResendWait(resendWaitSeconds(now, now));
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Better Auth path (self-hosted) when active; Supabase otherwise.
    if (isBetterAuthClientEnabled()) {
      try {
        const { data, error: baError } = await authClient.signIn.email({ email, password });
        if (baError) {
          setError(baError.message || 'Invalid email or password.');
          setLoading(false);
          return;
        }
        // Password accepted but the account has 2FA on → email a code and
        // show the verification step instead of entering the console.
        if (needsSecondFactor(data)) {
          await sendCode();
          setStep('code');
          setLoading(false);
          return;
        }
      } catch {
        setError("We couldn't reach the sign-in service. Please try again in a moment.");
        setLoading(false);
        return;
      }
      router.push(redirect);
      router.refresh();
      return;
    }

    let authError;
    try {
      const supabase = createClient();
      ({ error: authError } = await supabase.auth.signInWithPassword({ email, password }));
    } catch {
      setError("We couldn't reach the sign-in service. Please try again in a moment.");
      setLoading(false);
      return;
    }

    if (authError) {
      const msg = authError.message === 'Invalid login credentials'
        ? 'Invalid login credentials — if you just signed up, please confirm your email first.'
        : authError.message;
      setError(msg);
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCompleteOtp(otp)) {
      setError(`Enter the ${OTP_LENGTH}-digit code from your email.`);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error: verifyError } = await authClient.twoFactor.verifyOtp({
        code: otp,
        trustDevice,
      });
      if (verifyError) {
        setError(otpErrorMessage(verifyError.code, verifyError.message));
        setLoading(false);
        return;
      }
    } catch {
      setError("We couldn't verify the code. Please try again in a moment.");
      setLoading(false);
      return;
    }
    router.push(redirect);
    router.refresh();
  };

  const handleResend = async () => {
    if (resendWaitSeconds(lastSentAt, Date.now()) > 0) return;
    setError('');
    setOtp('');
    await sendCode();
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    if (isBetterAuthClientEnabled()) {
      await authClient.signIn.social({ provider, callbackURL: redirect });
      return;
    }
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[var(--hs-surface-0)] flex items-center justify-center px-4 overflow-hidden">
      <ScrollProgressBar />
      {/* Subtle background blurs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[30%] -left-[15%] h-[60%] w-[50%] rounded-full bg-brand-200/20 blur-[150px]" />
        <div className="absolute top-[50%] -right-[15%] h-[60%] w-[40%] rounded-full bg-brand-200/15 blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <Link href="/" className="group/brand flex items-center justify-center gap-3 mb-8">
          <Logo size={36} />
          <TextLogo />
        </Link>

        {/* Card */}
        <div className="bg-white backdrop-blur-sm border border-[var(--hs-border)] rounded-2xl p-8 shadow-xl shadow-[var(--shadow-card)]">
          <h1 className="text-xl font-bold text-[var(--hs-ink)] text-center mb-1">
            {step === 'code' ? 'Check your email' : 'Welcome back'}
          </h1>
          <p className="text-[var(--hs-ink-secondary)] text-sm text-center mb-6">
            {step === 'code'
              ? `We sent a ${OTP_LENGTH}-digit code to ${email}`
              : 'Sign in to your Command Center'}
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4"
            >
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-red-400 text-sm">{error}</span>
            </motion.div>
          )}

          {step === 'code' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--hs-ink-secondary)] mb-1.5 uppercase tracking-wider">
                  Sign-in code
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--hs-ink-secondary)]" />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => setOtp(normalizeOtpInput(e.target.value))}
                    placeholder="000000"
                    autoFocus
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[var(--hs-border)] text-[var(--hs-ink)] text-lg font-mono tracking-[0.4em] placeholder:text-[var(--hs-ink-tertiary)] placeholder:tracking-[0.4em] focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 transition-all"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-[var(--hs-ink-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--hs-border)] accent-[var(--hs-steel-dark)]"
                />
                Trust this device for 30 days
              </label>

              <button
                type="submit"
                disabled={loading || !isCompleteOtp(otp)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-700 text-white text-sm font-semibold hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Verify <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendWait > 0}
                  className="font-medium text-brand-700 hover:text-brand-800 disabled:text-[var(--hs-ink-tertiary)] disabled:cursor-not-allowed"
                >
                  {resendWait > 0 ? `Resend code in ${resendWait}s` : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('credentials');
                    setOtp('');
                    setError('');
                  }}
                  className="font-medium text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)]"
                >
                  Back to password
                </button>
              </div>
            </form>
          ) : passwordless ? (
            <PasswordlessSignIn
              redirect={redirect}
              initialEmail={email}
              onBack={() => {
                setPasswordless(false);
                setError('');
              }}
            />
          ) : (
            <>
          <AuthTabs active="signin" redirect={redirectParam} />
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-[var(--hs-ink-secondary)] mb-1.5 uppercase tracking-wider">Work email</label>
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

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[var(--hs-ink-secondary)] uppercase tracking-wider">Password</label>
                <Link href="/forgot-password" className="text-[10px] font-medium text-brand-700 hover:text-brand-800">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--hs-ink-secondary)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-white border border-[var(--hs-border)] text-[var(--hs-ink)] text-sm placeholder:text-[var(--hs-ink-tertiary)] focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-700 text-white text-sm font-semibold hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Passwordless option — Supabase only (Better Auth path uses password + 2FA). */}
          {!isBetterAuthClientEnabled() && (
            <button
              type="button"
              onClick={() => {
                setPasswordless(true);
                setError('');
              }}
              className="mt-3 w-full text-center text-xs font-medium text-brand-700 hover:text-brand-800"
            >
              Email me a sign-in code or magic link instead
            </button>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[var(--hs-mist)]" />
            <span className="text-[10px] text-[var(--hs-ink-secondary)] uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-[var(--hs-mist)]" />
          </div>

          {/* OAuth Providers */}
          <div className="space-y-2.5">
            <button
              onClick={() => handleOAuthLogin('google')}
              aria-label="Sign in with Google"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--hs-border)] bg-white text-[var(--hs-ink-secondary)] text-sm font-medium hover:bg-[var(--hs-mist)] hover:text-[var(--hs-ink)] transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => handleOAuthLogin('github')}
              aria-label="Sign in with GitHub"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--hs-border)] bg-white text-[var(--hs-ink-secondary)] text-sm font-medium hover:bg-[var(--hs-mist)] hover:text-[var(--hs-ink)] transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Continue with GitHub
            </button>

          </div>

          {/* Terms */}
          <p className="text-[10px] text-[var(--hs-ink-secondary)] text-center mt-4">
            By continuing you agree to our{' '}
            <Link href="/terms" className="text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)] underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)] underline">Privacy Policy</Link>
          </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
