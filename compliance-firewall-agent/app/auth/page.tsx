"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Mail, CheckCircle, ArrowLeft, Sparkles, Lock, Zap, Eye } from "lucide-react";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Demo mode: simulate sending magic link
      // In production with Supabase configured, this would call:
      // const { error } = await supabase.auth.signInWithOtp({ email });
      await new Promise((r) => setTimeout(r, 1200)); // Simulate API call
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-surface-50 items-center justify-center p-12">
        <div className="bg-dot-grid absolute inset-0 opacity-20" />
        <div className="absolute inset-0 bg-aurora opacity-30" />

        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-brand-500/20 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-purple-500/15 rounded-full blur-[80px] animate-float" />

        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <Shield className="w-8 h-8 text-brand-200" />
            </div>
            <div>
              <span className="text-2xl font-bold text-white tracking-tight block">Kaelus</span>
              <span className="text-xs text-brand-300/60 uppercase tracking-widest">AI Compliance Firewall</span>
            </div>
          </div>

          <h1 className="text-display-sm font-bold text-white leading-tight mb-4">
            AI Compliance,{" "}
            <span className="text-gradient-brand">Automated.</span>
          </h1>
          <p className="text-lg text-brand-200/80 mb-10 leading-relaxed">
            Protect your enterprise data from unauthorized AI exposure with real-time interception, classification, and audit trails.
          </p>

          <div className="space-y-4">
            {[
              { icon: Zap, text: "Real-time LLM request interception" },
              { icon: Lock, text: "AES-256 encrypted quarantine vault" },
              { icon: Eye, text: "Immutable SHA-256 audit chain" },
              { icon: Sparkles, text: "AI-powered zero-shot classification" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.text} className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
                    <Icon className="w-4 h-4 text-brand-300" />
                  </div>
                  <span className="text-white/80 text-sm">{item.text}</span>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="mt-10 flex items-center gap-8 border-t border-white/10 pt-8">
            <div>
              <p className="text-2xl font-bold text-white">99.9%</p>
              <p className="text-xs text-white/40">Accuracy</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">&lt;50ms</p>
              <p className="text-xs text-white/40">Latency</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">16</p>
              <p className="text-xs text-white/40">Patterns</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface relative">
        <div className="absolute inset-0 bg-dot-grid opacity-10" />
        <div className="relative z-10 w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center border border-brand-500/20">
              <Shield className="w-5 h-5 text-brand-400" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Kaelus</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-white/50 text-sm mb-8">
            Sign in to access the compliance dashboard.
          </p>

          {sent ? (
            <div className="glass-card p-6 text-center animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-success-muted flex items-center justify-center mx-auto mb-4 relative">
                <Mail className="w-7 h-7 text-success" />
                <div className="absolute inset-0 rounded-full bg-success/20 animate-ping" style={{ animationDuration: "2s" }} />
              </div>
              <h3 className="text-white font-semibold mb-2">Check your email</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                We sent a magic link to{" "}
                <span className="text-white/70 font-medium">{email}</span>.
                Click the link to sign in securely.
              </p>
              <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
                <Link
                  href="/dashboard"
                  className="btn-primary w-full py-2.5 text-sm"
                >
                  Continue to Dashboard (Demo)
                </Link>
                <button
                  onClick={() => { setSent(false); setEmail(""); }}
                  className="text-sm text-brand-400 hover:text-brand-300 transition-colors block w-full text-center"
                >
                  Use a different email
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full bg-surface-100 border border-white/[0.06] rounded-xl px-4 py-3 text-white placeholder-white/25 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/25 focus:outline-none transition-all text-sm"
                />
              </div>

              {error && (
                <p className="text-sm text-danger">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  "Send Magic Link"
                )}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.06]" />
                </div>
                <div className="relative flex justify-center text-xs text-white/25">
                  <span className="bg-surface px-3">or try it first</span>
                </div>
              </div>

              <Link
                href="/dashboard"
                className="btn-ghost w-full py-3 text-center"
              >
                <Sparkles className="w-4 h-4" />
                Explore Live Dashboard
              </Link>

              <p className="text-center text-xs text-white/30">
                Passwordless authentication via Supabase. No credit card required.
              </p>
            </form>
          )}

          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 text-sm text-white/40 hover:text-white/60 mt-8 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
