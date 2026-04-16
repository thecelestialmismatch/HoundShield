"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  Shield,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Box,
  Plus,
  ArrowRight,
  Clock,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";

interface ClientSummary {
  client_org_id: string;
  client_name: string;
  status: "active" | "suspended" | "trial";
  docker_api_key: string;
  total_events: number;
  blocked_count: number;
  quarantined_count: number;
  last_event_at: string | null;
}

interface Stats {
  total_clients: number;
  total_blocks: number;
  active_proxies: number;
}

export default function PartnerDashboard() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [stats, setStats] = useState<Stats>({ total_clients: 0, total_blocks: 0, active_proxies: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("partner_client_summary")
        .select("*")
        .eq("partner_user_id", user.id)
        .order("last_event_at", { ascending: false, nullsFirst: false });

      if (data) {
        setClients(data as ClientSummary[]);
        setStats({
          total_clients: data.length,
          total_blocks: data.reduce((s, c) => s + (c.blocked_count ?? 0), 0),
          active_proxies: data.filter(
            (c) =>
              c.last_event_at &&
              Date.now() - new Date(c.last_event_at).getTime() < 24 * 60 * 60 * 1000
          ).length,
        });
      }
      setLoading(false);
    }

    void load();
  }, []);

  const statCards = [
    {
      label: "Client Organizations",
      value: stats.total_clients,
      icon: Building2,
      color: "brand",
    },
    {
      label: "CUI Blocks (All Time)",
      value: stats.total_blocks,
      icon: Shield,
      color: "rose",
    },
    {
      label: "Active Proxies (24h)",
      value: stats.active_proxies,
      icon: Box,
      color: "emerald",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Partner Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            C3PAO multi-tenant management — all client organizations in one view
          </p>
        </div>
        <Link
          href="/partner/clients"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium hover:bg-brand-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg bg-${color}-500/10`}>
                <Icon className={`w-4 h-4 text-${color}-400`} />
              </div>
              <span className="text-xs text-slate-400 font-medium">{label}</span>
            </div>
            <div className="text-3xl font-display font-bold text-white">
              {loading ? (
                <div className="h-9 w-16 rounded-lg bg-white/5 animate-pulse" />
              ) : (
                value.toLocaleString()
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Client Table */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white">Client Organizations</h2>
          <Link
            href="/partner/clients"
            className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading clients…</div>
        ) : clients.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-4">No client organizations yet</p>
            <Link
              href="/partner/clients"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium hover:bg-brand-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add first client
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {clients.slice(0, 10).map((client) => (
              <Link
                key={client.client_org_id}
                href={`/partner/clients/${client.client_org_id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors group"
              >
                {/* Status dot */}
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    client.status === "active"
                      ? "bg-emerald-500"
                      : client.status === "trial"
                      ? "bg-amber-500"
                      : "bg-slate-600"
                  }`}
                />

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate group-hover:text-brand-300 transition-colors">
                    {client.client_name}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">{client.status}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {(client.blocked_count ?? 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-rose-400 flex items-center gap-1 justify-end">
                      <Shield className="w-2.5 h-2.5" /> Blocked
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {(client.quarantined_count ?? 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-amber-400 flex items-center gap-1 justify-end">
                      <AlertTriangle className="w-2.5 h-2.5" /> Quarantined
                    </p>
                  </div>
                  <div className="hidden sm:block text-xs text-slate-500">
                    {client.last_event_at ? (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(client.last_event_at).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-slate-600">No events yet</span>
                    )}
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            href: "/partner/deploy",
            icon: Box,
            title: "Generate Deploy Key",
            desc: "Create a Docker deploy key for a new client — 2 minutes",
          },
          {
            href: "/partner/clients",
            icon: Building2,
            title: "Add Client Org",
            desc: "Onboard a new defense contractor to Kaelus in under 2 minutes",
          },
          {
            href: "/partner/billing",
            icon: TrendingUp,
            title: "Partner Billing",
            desc: "$75/client/month — view invoices and usage",
          },
        ].map(({ href, icon: Icon, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-start gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-brand-500/20 transition-all"
          >
            <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20">
              <Icon className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white group-hover:text-brand-300 transition-colors">
                {title}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
