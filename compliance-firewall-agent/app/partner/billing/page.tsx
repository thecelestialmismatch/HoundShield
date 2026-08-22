"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, ExternalLink, FileText, Loader2 } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  PARTNER_ENGAGEMENT,
  PARTNER_ENGAGEMENT_MARGIN_LOW_PCT,
  PARTNER_ENGAGEMENT_MARGIN_HIGH_PCT,
  PARTNER_DISCOUNT_LABEL,
  RISK_REPORT,
  formatUSD,
} from "@/lib/pricing/plans";

/**
 * Partner billing.
 *
 * WHAT THIS PAGE USED TO SAY, AND WHY IT WAS DELETED.
 * It advertised a recurring per-client partner subscription, billed monthly via
 * Stripe, over a three-tier volume table, with a "Next Invoice" date computed as
 * `today + 1 month`.
 *
 * (The exact strings are quoted in
 * `lib/pricing/__tests__/partner-offer-coherence.test.ts`, not here: the guard
 * that now bans a recurring partner rate scans this file, and it should trip on
 * this page whether the rate is being advertised or merely being remembered.)
 *
 * None of it existed. There is no per-client SKU, no recurring partner charge,
 * no volume tier and no invoice on that date. The whole model was a third
 * pricing grid living on the one surface where it does the most damage: the
 * dashboard of a partner who signed an agreement saying something else.
 *
 * The canonical economics are in `lib/pricing/plans.ts` and are deliberately
 * simple. Retail is a public $499. A partner buys the same report at
 * $399 — a flat $100 off, taken as a DISCOUNT at purchase, so nothing
 * is ever invoiced to a partner on a schedule and no money ever flows back out.
 * The partner's own margin comes from the engagement they wrap around it.
 *
 * Everything below is either read from that module or read from the partner's
 * own rows. Nothing on this page is computed from a rate that does not exist.
 */
export default function PartnerBillingPage() {
  const [counts, setCounts] = useState<{ active: number; trial: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient();

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("partner_organizations")
          .select("status")
          .eq("partner_user_id", user.id);

        if (data) {
          setCounts({
            active: data.filter((r) => r.status === "active").length,
            trial: data.filter((r) => r.status === "trial").length,
          });
        }
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Partner Billing</h1>
        <p className="text-sm text-slate-400 mt-1">
          There is no partner subscription. You pay {formatUSD(RISK_REPORT.wholesalePrice)} per
          report, at the moment you order it.
        </p>
      </div>

      {/* Client counts — read from your own rows, not priced. */}
      {loading ? (
        <div className="flex items-center gap-3 py-8 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          Loading your client list…
        </div>
      ) : counts ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Active client orgs", value: counts.active },
            { label: "On trial", value: counts.trial },
          ].map(({ label, value }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-brand-500/10">
                  <Building2 className="w-4 h-4 text-brand-400" aria-hidden />
                </div>
                <span className="text-xs text-slate-400">{label}</span>
              </div>
              <div className="text-xl font-display font-bold text-white">{value}</div>
              {/*
                Deliberately NO derived revenue figure here. The old page showed
                "Monthly Billings" as `active x 75`, which is a number multiplied
                by a rate that does not exist. A client count is a fact; a
                billing total invented from it is not.
              */}
            </motion.div>
          ))}
        </div>
      ) : null}

      {/* What you actually pay, and what you can charge. */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white">Your economics per report</h2>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {[
            {
              label: "You pay HoundShield",
              value: formatUSD(PARTNER_ENGAGEMENT.wholesaleCost),
              note: `${PARTNER_DISCOUNT_LABEL} the public ${formatUSD(RISK_REPORT.oneTimePrice)} retail price. One-time, per report.`,
            },
            {
              label: `You charge for the ${PARTNER_ENGAGEMENT.name}`,
              value: `${formatUSD(PARTNER_ENGAGEMENT.suggestedListLow)} – ${formatUSD(PARTNER_ENGAGEMENT.suggestedListHigh)}`,
              note: "Suggested band. You set your own price — this is guidance, not a rule.",
            },
            {
              label: "Your gross margin",
              value: `${PARTNER_ENGAGEMENT_MARGIN_LOW_PCT}% – ${PARTNER_ENGAGEMENT_MARGIN_HIGH_PCT}%`,
              note: "The spread is your own advisory work, not a rebate from us.",
            },
          ].map(({ label, value, note }) => (
            <div key={label} className="px-6 py-4">
              {/* Stacks on a phone; the old fixed grid-cols-3 did not. */}
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <span className="text-sm text-slate-300">{label}</span>
                <span className="text-sm font-medium text-brand-400 sm:text-right">{value}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* The honesty constraint, stated to the partner directly. */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-slate-400" aria-hidden />
          <h3 className="text-sm font-semibold text-white">
            What the engagement price is for
          </h3>
        </div>
        <p className="text-xs text-slate-400">{PARTNER_ENGAGEMENT.identicalToDirect}</p>
        <ul className="mt-3 space-y-1.5">
          {PARTNER_ENGAGEMENT.partnerDelivers.map((item) => (
            <li key={item} className="text-xs text-slate-400 flex gap-2">
              <span className="text-brand-400" aria-hidden>—</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl bg-brand-500/5 border border-brand-500/20 p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Receipts and payment method</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Update your card and download receipts for the reports you have purchased.
          </p>
        </div>
        <a
          href="/api/stripe/portal"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium hover:bg-brand-500/20 transition-colors flex-shrink-0 self-start sm:self-auto"
        >
          Stripe Portal
          <ExternalLink className="w-3.5 h-3.5" aria-hidden />
        </a>
      </div>
    </div>
  );
}
