'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Link2,
  CheckCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import {
  normalizeOtpInput,
  isCompleteOtp,
  resendWaitSeconds,
  OTP_LENGTH,
} from '@/lib/auth/two-factor-state';
import {
  type PasswordlessView,
  isRateLimitError,
  supabaseOtpErrorMessage,
} from '@/lib/auth/passwordless-state';

interface PasswordlessSignInProps {
  /** Same-origin relative path to land on after sign-in (parent-sanitized). */
  redirect: string;
  initialEmail: string;
  /** Return to the password form. */
  onBack: () => void;
}

const inputClass =
  'w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[var(--hs-border)] text-[var(--hs-ink)] text-sm placeholder:text-[var(--hs-ink-tertiary)] focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 transition-all';

/**
 * Supabase passwordless sign-in: email OTP code OR magic link. Renders inside
 * the /login card in place of the password form. Login-only
 * (`shouldCreateUser:false`) and enumeration-safe — an unknown email advances
 * to the neutral "check your email" view, never an "account not found".
 */
export function PasswordlessSignIn({ redirect, initialEmail, onBack }: PasswordlessSignInProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [view, setView] = useState<PasswordlessView>('choose');
  const [sentVia, setSentVia] = useState<'code' | 'link'>('code');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [resendWait, setResendWait] = useState(0);

  useEffect(() => {
    if (resendWait <= 0) return;
    const id = setInterval(() => setResendWait(resendWaitSeconds(lastSentAt, Date.now())), 1000);
    return () => clearInterval(id);
  }, [resendWait, lastSentAt]);

  const send = async (method: 'code' | 'link') => {
    if (!email) {
      setError('Enter your email first.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const options: { shouldCreateUser: boolean; emailRedirectTo?: string } = {
        shouldCreateUser: false,
      };
      if (method === 'link') {
        options.emailRedirectTo = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(
          redirect,
        )}`;
      }
      const { error: sendError } = await supabase.auth.signInWithOtp({ email, options });
      // Surface only throttling; hide account-existence errors (no enumeration).
      if (sendError && isRateLimitError(sendError.message)) {
        setError(supabaseOtpErrorMessage(sendError.message));
        setLoading(false);
        return;
      }
    } catch {
      setError("We couldn't reach the sign-in service. Please try again in a moment.");
      setLoading(false);
      return;
    }
    const now = Date.now();
    setLastSentAt(now);
    setResendWait(resendWaitSeconds(now, now));
    setSentVia(method);
    setView(method === 'code' ? 'code' : 'sent');
    setLoading(false);
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCompleteOtp(otp)) {
      setError(`Enter the ${OTP_LENGTH}-digit code from your email.`);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });
      if (verifyError) {
        setError(supabaseOtpErrorMessage(verifyError.message));
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

  const resend = async () => {
    if (resendWaitSeconds(lastSentAt, Date.now()) > 0) return;
    setOtp('');
    await send(sentVia);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      {view === 'choose' && (
        <>
          <div>
            <label className="block text-xs font-medium text-[var(--hs-ink-secondary)] mb-1.5 uppercase tracking-wider">
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
                autoFocus
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => send('code')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-700 text-white text-sm font-semibold hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <KeyRound className="w-4 h-4" /> Email me a 6-digit code
          </button>

          <button
            type="button"
            onClick={() => send('link')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--hs-border)] bg-white text-[var(--hs-ink-secondary)] text-sm font-medium hover:bg-[var(--hs-mist)] hover:text-[var(--hs-ink)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Link2 className="w-4 h-4" /> Email me a magic link
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)]"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Sign in with a password instead
          </button>
        </>
      )}

      {view === 'code' && (
        <form onSubmit={verify} className="space-y-4">
          <p className="text-[var(--hs-ink-secondary)] text-sm text-center">
            We sent a {OTP_LENGTH}-digit code to {email}
          </p>
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
              onClick={resend}
              disabled={resendWait > 0}
              className="font-medium text-brand-700 hover:text-brand-800 disabled:text-[var(--hs-ink-tertiary)] disabled:cursor-not-allowed"
            >
              {resendWait > 0 ? `Resend code in ${resendWait}s` : 'Resend code'}
            </button>
            <button
              type="button"
              onClick={() => {
                setView('choose');
                setOtp('');
                setError('');
              }}
              className="font-medium text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)]"
            >
              Use a different method
            </button>
          </div>
        </form>
      )}

      {view === 'sent' && (
        <div className="text-center space-y-4 py-2">
          <div className="w-12 h-12 rounded-full bg-[rgba(5,150,105,0.1)] border border-[rgba(5,150,105,0.2)] flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6 text-[var(--hs-success)]" />
          </div>
          <p className="text-sm text-[var(--hs-ink-secondary)] leading-relaxed">
            We sent a magic link to <span className="font-medium text-[var(--hs-ink)]">{email}</span>.
            <br />
            Click the link in the email to sign in.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <button
              type="button"
              onClick={resend}
              disabled={resendWait > 0}
              className="font-medium text-brand-700 hover:text-brand-800 disabled:text-[var(--hs-ink-tertiary)] disabled:cursor-not-allowed"
            >
              {resendWait > 0 ? `Resend link in ${resendWait}s` : 'Resend link'}
            </button>
            <button
              type="button"
              onClick={() => {
                setView('choose');
                setError('');
              }}
              className="font-medium text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)]"
            >
              Use a different method
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
