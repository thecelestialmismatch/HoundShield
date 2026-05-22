"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, TrendingUp, Building2, ExternalLink, Loader2 } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";

interface BillingInfo {
  active_clients: number;
  trial_clients: number;
  monthly_revenue: number;
  next_invoice_date: string;
}

export default function PartnerBillingPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const PARTNER_RATE_PER_CLIENT = 75; // $75/client/month

  useEffect(() => {
    const supabase = createBrowserClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("partner_organizations")
        .select("status")
        .eq("partner_user_id", user.id);

      if (data) {
        const active = data.filter((r) => r.status === "active").length;
        const trial = data.filter((r) => r.status === "trial").length;
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1, 1);

        setBilling({
          active_clients: active,
          trial_clients: trial,
          monthly_revenue: active * PARTNER_RATE_PER_CLIENT,
          next_invoice_date: nextMonth.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
        });
      }
      setLoading(false);
    }

    void load();
  }, []);

  const cards = billing
    ? [
        {
          label: "Active Clients",
          value: billing.active_clients,
          icon: Building2,
          color: "brand",
          sub: `${billing.trial_clients} on trial`,
        },
        {
          label: "Monthly Billings",
          value: `$${billing.monthly_revenue.toLocaleString()}`,
          icon: TrendingUp,
          color: "emerald",
          sub: `$${PARTNER_RATE_PER_CLIENT}/client/mo`,
        },
        {
          label: "Next Invoice",
          value: billing.next_invoice_date,
          icon: CreditCard,
          color: "amber",
          sub: "Billed automatically via Stripe",
        },
      ]
    : [];

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Partner Billing</h1>
        <p className="text-sm text-slate-400 mt-1">
          C3PAO partner tier — $75/client/month, invoiced monthly via Stripe
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex items-center gap-3 py-8 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading billing…
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cards.map(({ label, value, icon: Icon, color, sub }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg bg-${color}-500/10`}>
                  <Icon className={`w-4 h-4 text-${color}-400`} />
                </div>
                <span className="text-xs text-slate-400">{label}</span>
              </div>
              <div className="text-xl font-display font-bold text-white">{value}</div>
              <div className="text-xs text-slate-500 mt-1">{sub}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tier table */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white">Partner Tier Structure</h2>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {[
            { range: "1–5 clients", rate: "$75/client/mo", total: "Up to $375/mo" },
            { range: "6–20 clients", rate: "$65/client/mo", total: "Up to $1,300/mo" },
            { range: "21–50 clients", rate: "$55/client/mo", total: "Up to $2,750/mo" },
            { range: "51+ clients", rate: "Custom", total: "Contact us" },
          ].map(({ range, rate, total }) => (
            <div
              key={range}
              className="grid grid-cols-3 gap-4 px-6 py-3 text-sm"
            >
              <span className="text-slate-300">{range}</span>
              <span className="text-brand-400 font-medium">{rate}</span>
              <span className="text-slate-500 text-right">{total}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stripe portal link */}
      <div className="rounded-2xl bg-brand-500/5 border border-brand-500/20 p-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Manage Payment Method</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Update card, download invoices, view billing history via Stripe portal
          </p>
        </div>
        <a
          href="/api/stripe/portal"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium hover:bg-brand-500/20 transition-colors flex-shrink-0"
        >
          Stripe Portal
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
