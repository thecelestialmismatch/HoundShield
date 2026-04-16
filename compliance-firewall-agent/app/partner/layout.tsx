"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Rocket,
  CreditCard,
  Settings,
  Menu,
  Bell,
  ChevronDown,
  Building2,
  Box,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { TextLogo } from "@/components/TextLogo";
import { createBrowserClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { id: "dashboard", label: "Partner Dashboard", icon: LayoutDashboard, href: "/partner" },
  { id: "clients", label: "Client Organizations", icon: Building2, href: "/partner/clients" },
  { id: "deploy", label: "Deploy Keys", icon: Box, href: "/partner/deploy" },
  { id: "billing", label: "Partner Billing", icon: CreditCard, href: "/partner/billing" },
  { id: "team", label: "Partner Team", icon: Users, href: "/partner/team" },
  { id: "settings", label: "Settings", icon: Settings, href: "/partner/settings" },
];

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0d0d14] border-r border-white/[0.06] transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-[240px]"
      }`}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-white/[0.06] px-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Logo className="w-9 h-9" />
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <TextLogo className="text-lg" variant="dark" />
              <span className="text-[10px] text-slate-500 -mt-0.5 tracking-wider uppercase">
                C3PAO Portal
              </span>
            </motion.div>
          )}
        </Link>
      </div>

      {/* C3PAO badge */}
      {!collapsed && (
        <div className="px-3 py-3">
          <div className="flex items-center gap-2 rounded-xl bg-brand-500/10 border border-brand-500/20 px-3 py-2">
            <Rocket className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-xs text-brand-300 font-medium">Authorized C3PAO</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <AnimatePresence initial={false}>
          {NAV_ITEMS.map(({ id, label, icon: Icon, href }) => {
            const isActive =
              href === "/partner" ? pathname === "/partner" : pathname.startsWith(href);

            return (
              <Link
                key={id}
                href={href}
                className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 mb-0.5 text-[13px] font-medium transition-all duration-200 ${
                  collapsed ? "justify-center" : ""
                } ${
                  isActive
                    ? "bg-brand-500/10 text-brand-400"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                }`}
                title={collapsed ? label : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="partnerActive"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-brand-500"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? "text-brand-500" : "text-slate-500 group-hover:text-slate-300"
                  }`}
                />
                {!collapsed && <span className="flex-1 truncate">{label}</span>}
              </Link>
            );
          })}
        </AnimatePresence>
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/[0.06] p-3">
        <Link
          href="/command-center"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-colors mb-1"
        >
          <LayoutDashboard className="w-4 h-4" />
          {!collapsed && <span>Main Dashboard</span>}
        </Link>
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-colors"
        >
          <Menu className="w-4 h-4" />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

function Topbar({ sidebarCollapsed }: { sidebarCollapsed: boolean }) {
  const [userInitial, setUserInitial] = useState("P");

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const email = data.user.email ?? "";
        const name =
          (data.user.user_metadata?.full_name as string | undefined) ?? email;
        setUserInitial((name[0] ?? "P").toUpperCase());
      }
    });
  }, []);

  return (
    <header
      className={`fixed top-0 right-0 z-40 h-14 border-b border-white/[0.06] bg-[#07070b]/80 backdrop-blur-xl flex items-center justify-between px-6 transition-all duration-300 ${
        sidebarCollapsed ? "left-[68px]" : "left-[240px]"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 font-medium tracking-wide">C3PAO Partner Portal</span>
        <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold ring-1 ring-emerald-500/20">
          AUTHORIZED
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        <Link
          href="/partner/settings"
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {userInitial}
          </div>
          <ChevronDown className="w-3 h-3 text-slate-500" />
        </Link>
      </div>
    </header>
  );
}

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#07070b] text-white font-sans">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] h-[50%] w-[40%] rounded-full bg-brand-400/[0.03] blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] h-[50%] w-[35%] rounded-full bg-violet-400/[0.02] blur-[120px]" />
      </div>

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />
      <Topbar sidebarCollapsed={sidebarCollapsed} />

      <main
        className={`relative z-10 min-h-screen pt-14 transition-all duration-300 ${
          sidebarCollapsed ? "ml-[68px]" : "ml-[240px]"
        }`}
      >
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
