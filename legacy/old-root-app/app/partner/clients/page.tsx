"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  Shield,
  AlertTriangle,
  ArrowRight,
  Clock,
  Loader2,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";

interface Client {
  client_org_id: string;
  client_name: string;
  status: "active" | "suspended" | "trial";
  docker_api_key: string;
  total_events: number;
  blocked_count: number;
  quarantined_count: number;
  last_event_at: string | null;
  created_at: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

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
      setClients((data ?? []) as Client[]);
      setLoading(false);
    }

    void load();
  }, []);

  const filtered = clients.filter((c) =>
    c.client_name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Client Organizations</h1>
          <p className="text-sm text-slate-400 mt-1">
            All defense contractors you manage as their C3PAO partner
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium hover:bg-brand-500/20 transition-colors">
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search clients…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/50"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/[0.06] text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
          <div className="col-span-4">Organization</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-2 text-right">Blocked</div>
          <div className="col-span-2 text-right">Quarantined</div>
          <div className="col-span-1 text-right">Last Event</div>
          <div className="col-span-1" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading clients…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No clients found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((client, i) => (
              <motion.div
                key={client.client_org_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  href={`/partner/clients/${client.client_org_id}`}
                  className="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Name + created */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 text-sm font-bold flex-shrink-0">
                      {client.client_name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-brand-300 transition-colors">
                        {client.client_name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Added {new Date(client.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex justify-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        client.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : client.status === "trial"
                          ? "bg-brand-500/10 text-brand-400"
                          : "bg-slate-700/50 text-slate-400"
                      }`}
                    >
                      {client.status}
                    </span>
                  </div>

                  {/* Blocked */}
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-semibold text-white">
                      {(client.blocked_count ?? 0).toLocaleString()}
                    </span>
                    <div className="text-[10px] text-rose-400 flex items-center gap-0.5 justify-end">
                      <Shield className="w-2.5 h-2.5" /> blocked
                    </div>
                  </div>

                  {/* Quarantined */}
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-semibold text-white">
                      {(client.quarantined_count ?? 0).toLocaleString()}
                    </span>
                    <div className="text-[10px] text-brand-400 flex items-center gap-0.5 justify-end">
                      <AlertTriangle className="w-2.5 h-2.5" /> flagged
                    </div>
                  </div>

                  {/* Last event */}
                  <div className="col-span-1 text-right">
                    {client.last_event_at ? (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {new Date(client.last_event_at).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-600">—</span>
                    )}
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 transition-colors" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
