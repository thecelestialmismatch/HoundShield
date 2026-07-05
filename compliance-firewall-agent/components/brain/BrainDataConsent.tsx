"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Lock, Loader2 } from "lucide-react";

/**
 * Brain AI data-access consent control. Reads and writes /api/brain/consent.
 *
 * This is the "ask permission" surface: it states exactly what Brain AI can and
 * cannot access, defaults to OFF, and is revocable. Granting it lets Brain AI
 * answer "where do I stand / what's my next step" from the customer's OWN data.
 * It never grants access to any other customer's data.
 */

const CAN_ACCESS = [
  "Your SPRS score and assessment progress",
  "Your open control gaps and how to fix them",
  "Your $499 report order status",
];

const CANNOT_ACCESS = [
  "Any other customer's data — ever",
  "Your prompt content or CUI/PHI (never sent to any AI)",
  "Anything, until you turn this on",
];

export function BrainDataConsent({ compact = false }: { compact?: boolean }) {
  const [consent, setConsent] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/brain/consent")
      .then((res) => (res.ok ? res.json() : { consent: false, configured: false }))
      .then((data: { consent?: boolean; configured?: boolean }) => {
        if (!active) return;
        setConsent(Boolean(data?.consent));
        setConfigured(data?.configured !== false);
      })
      .catch(() => {
        if (active) setConsent(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function toggle(next: boolean) {
    setSaving(true);
    try {
      const res = await fetch("/api/brain/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: next }),
      });
      if (res.ok) {
        const data = await res.json();
        setConsent(Boolean(data.consent));
      }
    } catch {
      /* keep prior state on failure */
    } finally {
      setSaving(false);
    }
  }

  if (consent === null) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm text-white/60">
        <Loader2 className="h-4 w-4 animate-spin text-brand-400" aria-hidden />
        Loading data-access settings…
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Lock className="h-4 w-4 text-brand-400" aria-hidden />
            Brain AI data access
          </h3>
          <p className="mt-1 text-sm text-white/60">
            Off by default. Turn it on to let Brain AI give you personalized guidance from your own
            account data. You can withdraw it anytime.
          </p>
        </div>

        {/* Toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={consent}
          aria-label="Toggle Brain AI data access"
          disabled={saving || !configured}
          onClick={() => toggle(!consent)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
            consent ? "bg-brand-500" : "bg-white/15"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              consent ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {!configured && (
        <p className="mb-4 text-xs text-white/40">
          Account data access is unavailable in demo mode.
        </p>
      )}

      {!compact && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              When on, Brain AI can use
            </p>
            <ul className="space-y-1 text-sm text-white/70">
              {CAN_ACCESS.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-white/50">
              <Lock className="h-3.5 w-3.5" aria-hidden />
              Never accessible
            </p>
            <ul className="space-y-1 text-sm text-white/70">
              {CANNOT_ACCESS.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-white/40">
        {consent
          ? "Brain AI can use your own account data to personalize guidance. Toggle off to withdraw."
          : "Brain AI has no access to your account data. Ask it “where do I stand?” after turning this on."}
      </p>
    </div>
  );
}
