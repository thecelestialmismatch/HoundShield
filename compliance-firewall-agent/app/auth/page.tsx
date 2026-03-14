"use client";

import { Logo } from "@/components/Logo";
import { TextLogo } from "@/components/TextLogo";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import {
  Shield,
  ArrowLeft,
  Lock,
  Zap,
  Eye,
  EyeOff,
  Fingerprint,
  Activity,
  ShieldCheck,
  Globe,
  Scale,
  User,
  Mail,
  KeyRound,
} from "lucide-react";

/* ──────────────────────────────────────────────
   Inline SVG brand logos (proper official paths)
   ────────────────────────────────────────────── */
function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GitHubLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function MicrosoftLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 21 21">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

/* ──────────────────────────────────────────────
   Live scanner animation component
   ────────────────────────────────────────────── */
function LiveScanner() {
  const [threats, setThreats] = useState(2847);
  const [requests, setRequests] = useState(14923);
  const [scanLines, setScanLines] = useState<{ id: number; y: number }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setThreats((t) => t + Math.floor(Math.random() * 3));
      setRequests((r) => r + Math.floor(Math.random() * 12) + 1);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let id = 0;
    const interval = setInterval(() => {
      id++;
      setScanLines((prev) => [...prev.slice(-4), { id, y: Math.random() * 100 }]);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full mt-8">
      {/* Scanner box */}
      <div className="relative rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden p-4">
        {/* Scan line animation */}
        <div className="scan-line" />

        {/* Status header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </div>
          <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-widest">
            Live Scanning
          </span>
          <Activity className="w-3 h-3 text-emerald-400/60 ml-auto animate-pulse" />
        </div>

        {/* Live log lines */}
        <div className="space-y-1.5 font-mono text-[10px]">
          {[
            { status: "PASS", msg: "GPT-4o request — PII check cleared", color: "text-emerald-400/70" },
            { status: "BLOCK", msg: "Claude req — SSN pattern detected", color: "text-red-400/70" },
            { status: "PASS", msg: "Gemini request — compliant payload", color: "text-emerald-400/70" },
            { status: "FLAG", msg: "DeepSeek req — PHI proximity alert", color: "text-amber-400/70" },
          ].map((line, i) => (
            <div
              key={i}
              className="flex items-center gap-2 opacity-0"
              style={{
                animation: `stagger-fade-in-up 0.5s ease-out ${i * 0.15}s forwards`,
              }}
            >
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${line.status === "PASS"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : line.status === "BLOCK"
                    ? "bg-red-500/10 text-red-400"
                    : "bg-amber-500/10 text-amber-400"
                  }`}
              >
                {line.status}
              </span>
              <span className={line.color}>{line.msg}</span>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 mt-4 pt-3 border-t border-white/[0.04]">
          <div>
            <p className="text-[10px] text-slate-900/30 uppercase tracking-wider">Threats Blocked</p>
            <p className="text-lg font-bold text-slate-900 tabular-nums">{threats.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-900/30 uppercase tracking-wider">Requests Scanned</p>
            <p className="text-lg font-bold text-slate-900 tabular-nums">{requests.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-900/30 uppercase tracking-wider">Latency</p>
            <p className="text-lg font-bold text-emerald-400">&lt;23ms</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main Auth Page
   ────────────────────────────────────────────── */
export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  // Sign In state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up state
  const [fullName, setFullName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  const handleSignIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);
      try {
        const supabase = createClient();
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: signInEmail,
          password: signInPassword,
        });
        if (authError) {
          setError(authError.message);
          setLoading(false);
          return;
        }
        router.push("/command-center");
        router.refresh();
      } catch {
        setError("Invalid credentials. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [signInEmail, signInPassword, router]
  );

  const handleSignUp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);
      try {
        const supabase = createClient();
        const { error: authError } = await supabase.auth.signUp({
          email: signUpEmail,
          password: signUpPassword,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (authError) {
          setError(authError.message);
          setLoading(false);
          return;
        }
        setSignUpSuccess(true);
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [signUpEmail, signUpPassword, fullName]
  );

  const handleSocialAuth = useCallback(async (provider: "google" | "github" | "microsoft" | "sso") => {
    setLoading(true);
    try {
      const supabase = createClient();
      // Map "microsoft" to "azure" (Supabase provider name) and "sso" to SAML
      const supabaseProvider = provider === "microsoft" ? "azure" : provider === "sso" ? "azure" : provider;
      await supabase.auth.signInWithOAuth({
        provider: supabaseProvider as 'google' | 'github' | 'azure',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          ...(supabaseProvider === 'azure' && { scopes: 'email profile openid' }),
        },
      });
    } catch {
      setError(`Failed to authenticate with ${provider}. Please try again.`);
      setLoading(false);
    }
  }, []);

  /* Spinner SVG */
  const Spinner = () => (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <div className="flex min-h-screen bg-surface">
      {/* ─── LEFT BRANDING PANEL ─── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-surface-50 items-center justify-center p-12 xl:p-16">
        {/* Background textures */}
        <div className="bg-dot-grid absolute inset-0 opacity-20" />
        <div className="absolute inset-0 bg-aurora opacity-30" />

        {/* Floating orbs */}
        <div className="absolute top-16 left-8 w-72 h-72 bg-brand-500/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-24 right-12 w-56 h-56 bg-purple-500/15 rounded-full blur-[100px] animate-float" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-pink-500/10 rounded-full blur-[80px] animate-float" style={{ animationDelay: "-3s" }} />

        <div className="relative z-10 max-w-lg w-full">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-3.5 mb-10 group hover:opacity-90 transition-opacity">
            <Logo className="w-14 h-14 rounded-2xl shadow-glow group-hover:border-brand-500/40 transition-colors [&>svg:first-child]:w-7 [&>svg:first-child]:h-7 [&>svg:last-child]:w-3.5 [&>svg:last-child]:h-3.5" />
            <div>
              <TextLogo />
              <span className="text-[10px] text-brand-300/50 uppercase tracking-[0.2em]">
                AI Compliance Firewall
              </span>
            </div>
          </Link>

          {/* Headline */}
          <h1 className="text-display-sm font-bold text-slate-900 leading-[1.05] mb-4">
            Secure Your{" "}
            <span className="text-gradient-brand">AI Pipeline</span>
          </h1>
          <p className="text-lg text-brand-200/70 mb-10 leading-relaxed max-w-md">
            Enterprise-grade compliance gateway that intercepts, classifies, and audits every AI request in real time.
          </p>

          {/* Feature list */}
          <div className="space-y-3.5">
            {[
              { icon: Zap, text: "Real-time LLM request interception", highlight: "< 23ms" },
              { icon: Lock, text: "AES-256 encrypted quarantine vault" },
              { icon: Eye, text: "Immutable SHA-256 audit trail" },
              { icon: Fingerprint, text: "AI-powered PII & PHI detection" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.text} className="flex items-center gap-3 group">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center border border-white/[0.08] group-hover:bg-white/[0.1] group-hover:border-brand-500/20 transition-all duration-300">
                    <Icon className="w-4 h-4 text-brand-300" />
                  </div>
                  <span className="text-slate-900/75 text-sm group-hover:text-slate-900/90 transition-colors">
                    {item.text}
                  </span>
                  {item.highlight && (
                    <span className="ml-auto text-[10px] font-mono font-bold text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {item.highlight}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Live Scanner */}
          <LiveScanner />
        </div>
      </div>

      {/* ─── RIGHT AUTH PANEL ─── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative">
        {/* Subtle background */}
        <div className="absolute inset-0 bg-dot-grid opacity-[0.06]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/[0.03] rounded-full blur-[120px]" />

        <div className="relative z-10 w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <Logo className="w-10 h-10" />
            <div>
              <TextLogo />
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-[1.7rem] font-bold text-slate-900 tracking-tight mb-1.5">
              {activeTab === "signin" ? "Welcome back" : "Get started"}
            </h2>
            <p className="text-slate-900/40 text-sm">
              {activeTab === "signin"
                ? "Sign in to access your compliance dashboard."
                : "Create your account and secure your AI pipeline."}
            </p>
          </div>

          {/* ─── AUTH CARD ─── */}
          <div className="glass-card p-6 sm:p-7">
            {/* Tab Switcher */}
            <div className="flex rounded-xl bg-white/[0.04] p-1 mb-6 border border-white/[0.04]">
              {(["signin", "signup"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setError("");
                    setShowPassword(false);
                  }}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${activeTab === tab
                    ? "bg-brand-500 text-slate-900 shadow-lg shadow-brand-500/25"
                    : "text-slate-900/40 hover:text-slate-900/60"
                    }`}
                >
                  {tab === "signin" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
                {error}
              </div>
            )}

            {/* ─── SIGN IN FORM ─── */}
            <div
              className={`transition-all duration-300 ${activeTab === "signin"
                ? "block opacity-100 translate-y-0"
                : "hidden opacity-0 translate-y-2 absolute pointer-events-none"
                }`}
            >
              <form onSubmit={handleSignIn} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-slate-900/70 mb-1.5 ml-0.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-900/20" />
                    <input
                      type="email"
                      required
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full bg-[#0d0d12] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-white/20 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/25 focus:bg-white/[0.05] focus:outline-none transition-all duration-200 text-sm shadow-inner"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 ml-0.5">
                    <label className="block text-xs font-medium text-slate-900/70">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-[11px] text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-900/20" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full bg-[#0d0d12] border border-white/[0.08] rounded-xl pl-10 pr-11 py-3 text-slate-900 placeholder-white/20 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/25 focus:bg-white/[0.05] focus:outline-none transition-all duration-200 text-sm shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-900/25 hover:text-slate-900/50 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Spinner />
                      Signing in...
                    </span>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </form>
            </div>

            {/* ─── SIGN UP FORM ─── */}
            <div
              className={`transition-all duration-300 ${activeTab === "signup"
                ? "block opacity-100 translate-y-0"
                : "hidden opacity-0 translate-y-2 absolute pointer-events-none"
                }`}
            >
              <form onSubmit={handleSignUp} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-900/70 mb-1.5 ml-0.5">
                    Full name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-900/20" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-[#0d0d12] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-white/20 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/25 focus:bg-white/[0.05] focus:outline-none transition-all duration-200 text-sm shadow-inner"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-slate-900/70 mb-1.5 ml-0.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-900/20" />
                    <input
                      type="email"
                      required
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full bg-[#0d0d12] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-white/20 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/25 focus:bg-white/[0.05] focus:outline-none transition-all duration-200 text-sm shadow-inner"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-medium text-slate-900/70 mb-1.5 ml-0.5">
                    Password
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-900/20" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      minLength={8}
                      className="w-full bg-[#0d0d12] border border-white/[0.08] rounded-xl pl-10 pr-11 py-3 text-slate-900 placeholder-white/20 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/25 focus:bg-white/[0.05] focus:outline-none transition-all duration-200 text-sm shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-900/25 hover:text-slate-900/50 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Spinner />
                      Creating account...
                    </span>
                  ) : (
                    "Sign up"
                  )}
                </button>
              </form>
            </div>

            {/* Divider */}
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.06]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[rgba(20,20,25,0.7)] px-4 text-xs font-medium text-slate-900/30">
                  or
                </span>
              </div>
            </div>

            {/* Social Auth Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleSocialAuth("google")}
                disabled={loading}
                className="flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-[#0d0d12] border border-white/[0.08] text-sm text-slate-900/80 font-medium hover:bg-white/[0.05] hover:border-white/[0.12] active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
              >
                <GoogleLogo className="w-4 h-4" />
                Continue with Google
              </button>
              <button
                onClick={() => handleSocialAuth("microsoft")}
                disabled={loading}
                className="flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-[#0d0d12] border border-white/[0.08] text-sm text-slate-900/80 font-medium hover:bg-white/[0.05] hover:border-white/[0.12] active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
              >
                <MicrosoftLogo className="w-4 h-4" />
                Continue with Microsoft
              </button>

              <button
                onClick={() => handleSocialAuth("github")}
                disabled={loading}
                className="flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-[#0d0d12] border border-white/[0.08] text-sm text-slate-900/80 font-medium hover:bg-white/[0.05] hover:border-white/[0.12] active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
              >
                <GitHubLogo className="w-4 h-4" />
                Continue with GitHub
              </button>
              <button
                onClick={() => handleSocialAuth("sso")}
                disabled={loading}
                className="flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-[#0d0d12] border border-white/[0.08] text-sm text-slate-900/80 font-medium hover:bg-white/[0.05] hover:border-white/[0.12] active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                Continue with SSO
              </button>
            </div>

            {/* Terms (sign up only) */}
            {activeTab === "signup" && (
              <p className="text-[11px] text-slate-900/25 text-center mt-6 leading-relaxed">
                By creating an account, you agree to our{" "}
                <span className="text-slate-900/40 hover:text-slate-900/60 cursor-pointer transition-colors">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="text-slate-900/40 hover:text-slate-900/60 cursor-pointer transition-colors">
                  Privacy Policy
                </span>
                .
              </p>
            )}
          </div>

          {/* ─── TRUST BADGES ─── */}
          <div className="mt-8 flex items-center justify-center gap-5">
            {[
              { icon: ShieldCheck, label: "SOC 2 Ready" },
              { icon: Globe, label: "GDPR" },
              { icon: Scale, label: "EU AI Act" },
            ].map((badge) => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.label}
                  className="flex items-center gap-1.5 text-slate-900/25 group"
                >
                  <div className="w-6 h-6 rounded-md bg-white/[0.04] flex items-center justify-center border border-white/[0.06] group-hover:border-brand-500/20 transition-colors">
                    <Icon className="w-3 h-3 text-slate-900/30 group-hover:text-brand-400/60 transition-colors" />
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wider group-hover:text-slate-900/40 transition-colors">
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ─── BACK TO HOME ─── */}
          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 text-sm text-slate-900/30 hover:text-slate-900/55 mt-6 transition-colors duration-200 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
