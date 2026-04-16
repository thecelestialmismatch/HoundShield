"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  ArrowLeft,
  Box,
  Clock,
  Loader2,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";

interface ProxyEvent {
  id: string;
  request_id: string;
  action: "ALLOWED" | "BLOCKED" | "QUARANTINED";
  risk_level: string;
  pattern_name: string | null;
  nist_control: string | null;
  scan_ms: number | null;
  source: string;
  created_at: string;
}

interface ClientInfo {
  client_name: string;
  status: string;
  docker_api_key: string;
  blocked_count: number;
  quarantined_count: number;
  total_events: number;
  last_event_at: string | null;
}

export default function ClientDetailPage() {
  const params = useParams();
  const orgId = params.orgId as string;

  const [client, setClient] = useState<ClientInfo | null>(null);
  const [events, setEvents] = useState<ProxyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [summaryRes, eventsRes] = await Promise.all([
        supabase
          .from("partner_client_summary")
          .select("*")
          .eq("partner_user_id", user.id)
          .eq("client_org_id", orgId)
          .single(),
        supabase
          .from("proxy_events")
          .select("*")
          .eq("org_id", orgId)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (summaryRes.data) setClient(summaryRes.data as ClientInfo);
      if (eventsRes.data) setEvents(eventsRes.data as ProxyEvent[]);
      setLoading(false);
    }

    void load();
  }, [orgId]);

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-slate-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading client…
      </div>
    );
  }

  if (!client) {
    return (
      <div className="py-20 text-center text-slate-500 text-sm">
        Client not found or you don&apos;t have access.
      </div>
    );
  }

  const actionIcon = {
    BLOCKED: <Shield className="w-3.5 h-3.5 text-rose-400" />,
    QUARANTINED: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
    ALLOWED: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
  };

  const riskColor: Record<string, string> = {
    CRITICAL: "text-rose-400",
    HIGH: "text-orange-400",
    MEDIUM: "text-amber-400",
    LOW: "text-blue-400",
    NONE: "text-slate-400",
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <Link
        href="/partner/clients"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All clients
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">{client.client_name}</h1>
          <p className="text-sm text-slate-400 mt-1">
            Status:{" "}
            <span
              className={
                client.status === "active" ? "text-emerald-400" : "text-amber-400"
              }
            >
              {client.status}
            </span>
          </p>
        </div>
        <Link
          href="/partner/deploy"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium hover:bg-brand-500/20 transition-colors"
        >
          <Box className="w-4 h-4" />
          Deploy Instructions
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Events", value: client.total_events ?? 0, color: "slate" },
          { label: "Blocked", value: client.blocked_count ?? 0, color: "rose" },
          { label: "Quarantined", value: client.quarantined_count ?? 0, color: "amber" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 text-center"
          >
            <div className={`text-2xl font-display font-bold text-${color}-400`}>
              {value.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Deploy key */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Box className="w-4 h-4 text-brand-400" />
            Docker Deploy Key
          </h3>
          <button
            onClick={() => copy(client.docker_api_key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white hover:border-white/20 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
        <code className="block w-full font-mono text-sm text-brand-300 bg-black/20 rounded-xl px-4 py-3 break-all">
          {client.docker_api_key}
        </code>
        <p className="text-xs text-slate-500 mt-2">
          Set as <code className="text-brand-400">KAELUS_LICENSE_KEY</code> in the Docker
          container. Never share with other clients.
        </p>
      </div>

      {/* Event log */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white">Recent Proxy Events</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Metadata only — no prompt content stored
          </p>
        </div>

        {events.length === 0 ? (
          <div className="py-12 text-center">
            <Box className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No events yet — proxy not yet deployed?</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {events.map((evt, i) => (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="grid grid-cols-12 gap-3 items-center px-6 py-3 hover:bg-white/[0.02] transition-colors"
              >
                {/* Action */}
                <div className="col-span-2 flex items-center gap-1.5 text-xs font-medium">
                  {actionIcon[evt.action]}
                  <span
                    className={
                      evt.action === "BLOCKED"
                        ? "text-rose-400"
                        : evt.action === "QUARANTINED"
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }
                  >
                    {evt.action}
                  </span>
                </div>

                {/* Risk */}
                <div className="col-span-2 text-xs font-medium">
                  <span className={riskColor[evt.risk_level] ?? "text-slate-400"}>
                    {evt.risk_level}
                  </span>
                </div>

                {/* Pattern */}
                <div className="col-span-3 text-xs text-slate-400 truncate">
                  {evt.pattern_name ?? "—"}
                </div>

                {/* NIST control */}
                <div className="col-span-2 text-xs font-mono text-brand-400/80">
                  {evt.nist_control ?? "—"}
                </div>

                {/* Scan ms */}
                <div className="col-span-1 text-xs text-slate-500 text-right">
                  {evt.scan_ms != null ? `${evt.scan_ms}ms` : "—"}
                </div>

                {/* Timestamp */}
                <div className="col-span-2 text-xs text-slate-500 text-right flex items-center gap-1 justify-end">
                  <Clock className="w-3 h-3" />
                  {new Date(evt.created_at).toLocaleTimeString()}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
