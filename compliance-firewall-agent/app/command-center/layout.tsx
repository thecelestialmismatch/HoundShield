"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Shield,
  Activity,
  AlertTriangle,
  Scan,
  Zap,
  ClipboardCheck,
  SearchX,
  FileBarChart,
  BookOpen,
  MessageSquare,
  ListChecks,
  Users,
  Settings,
  ChevronDown,
  Bell,
  Search,
  Menu,
  Command,
  ShieldCheck,
  Target,
  ScrollText,
  Wrench,
  SlidersHorizontal,
  BarChart3,
  Download,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { TextLogo } from "@/components/TextLogo";
import { DemoBanner } from "@/components/ui/demo-banner";
import { isSupabaseConfigured, createBrowserClient } from "@/lib/supabase/client";

/* ── Nav Structure ──────────────────────────────────────────────── */
type NavSection = {
  label: string;
  icon: typeof LayoutDashboard;
  items: {
    id: string;
    label: string;
    icon: typeof LayoutDashboard;
    href: string;
    badge?: string;
  }[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Firewall",
    icon: Shield,
    items: [
      { id: "overview", label: "Overview", icon: LayoutDashboard, href: "/command-center" },
      { id: "realtime", label: "Real-Time Feed", icon: Zap, href: "/command-center/realtime" },
      { id: "timeline", label: "Threat Timeline", icon: Activity, href: "/command-center/timeline" },
      { id: "scanner", label: "Live Scanner", icon: Scan, href: "/command-center/scanner" },
      { id: "events", label: "Audit Log", icon: ScrollText, href: "/command-center/events" },
      { id: "quarantine", label: "Quarantine", icon: AlertTriangle, href: "/command-center/quarantine", badge: "4" },
      { id: "rules", label: "Firewall Rules", icon: SlidersHorizontal, href: "/command-center/rules" },
      { id: "security", label: "Security Dashboard", icon: BarChart3, href: "/command-center/security" },
      { id: "audit-export", label: "Export Audit Log", icon: Download, href: "/command-center/audit-export" },
    ],
  },
  {
    label: "CMMC Shield",
    icon: ShieldCheck,
    items: [
      { id: "shield-dashboard", label: "SPRS Dashboard", icon: Target, href: "/command-center/shield" },
      { id: "assessment", label: "Assessment", icon: ClipboardCheck, href: "/command-center/shield/assessment" },
      { id: "gaps", label: "Gap Analysis", icon: SearchX, href: "/command-center/shield/gaps" },
      { id: "reports", label: "Reports", icon: FileBarChart, href: "/command-center/shield/reports" },
      { id: "resources", label: "Resources", icon: BookOpen, href: "/command-center/shield/resources" },
    ],
  },
  {
    label: "Response",
    icon: Wrench,
    items: [
      { id: "chat", label: "Compliance AI", icon: MessageSquare, href: "/command-center/chat" },
      { id: "tasks", label: "Remediation Tasks", icon: ListChecks, href: "/command-center/tasks" },
      { id: "team", label: "Team", icon: Users, href: "/command-center/team" },
      { id: "agents", label: "Agent Simulation", icon: Command, href: "/command-center/agents" },
      { id: "sdk", label: "SDK Integration", icon: BookOpen, href: "/command-center/sdk" },
    ],
  },
];

/* ── Sidebar ────────────────────────────────────────────────────── */
function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Firewall: true,
    "CMMC Shield": true,
    Response: true,
  });

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0d0d14] border-r border-white/[0.06] transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-[260px]"
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
                Command Center
              </span>
            </motion.div>
          )}
        </Link>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 py-3">
          <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-400 hover:border-white/20 transition-colors cursor-pointer">
            <Search className="w-3.5 h-3.5" />
            <span>Search...</span>
            <kbd className="ml-auto text-[10px] bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-slate-500 font-mono">
              K
            </kbd>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {NAV_SECTIONS.map((section) => {
          const SectionIcon = section.icon;
          const isExpanded = expandedSections[section.label];

          return (
            <div key={section.label} className="mb-1">
              {/* Section header */}
              <button
                onClick={() => !collapsed && toggleSection(section.label)}
                className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors ${
                  collapsed ? "justify-center" : ""
                }`}
              >
                <SectionIcon className="w-3.5 h-3.5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{section.label}</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                    />
                  </>
                )}
              </button>

              {/* Items */}
              <AnimatePresence initial={false}>
                {(isExpanded || collapsed) && (
                  <motion.div
                    initial={collapsed ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {section.items.map(({ id, label, icon: Icon, href, badge }) => {
                      const isActive =
                        href === "/command-center"
                          ? pathname === "/command-center"
                          : pathname.startsWith(href);

                      return (
                        <Link
                          key={id}
                          href={href}
                          className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
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
                              layoutId="sidebarActive"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-brand-500"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                            />
                          )}
                          <Icon
                            className={`w-4 h-4 flex-shrink-0 transition-colors ${
                              isActive
                                ? "text-brand-500"
                                : "text-slate-500 group-hover:text-slate-300"
                            }`}
                          />
                          {!collapsed && (
                            <>
                              <span className="flex-1 truncate">{label}</span>
                              {badge && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20">
                                  {badge}
                                </span>
                              )}
                            </>
                          )}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/[0.06] p-3 space-y-1">
        <Link
          href="/command-center/settings"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-colors"
        >
          <Settings className="w-4 h-4" />
          {!collapsed && <span>Settings</span>}
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

/* ── Topbar ─────────────────────────────────────────────────────── */
function Topbar({ sidebarCollapsed }: { sidebarCollapsed: boolean }) {
  const [userInitial, setUserInitial] = useState("K");

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const email = data.user.email ?? "";
        const name =
          (data.user.user_metadata?.full_name as string | undefined) ??
          (data.user.user_metadata?.name as string | undefined) ??
          email;
        setUserInitial((name[0] ?? "K").toUpperCase());
      }
    });
  }, []);

  return (
    <header
      className={`fixed top-0 right-0 z-40 h-14 border-b border-white/[0.06] bg-[#07070b]/80 backdrop-blur-xl flex items-center justify-between px-6 transition-all duration-300 ${
        sidebarCollapsed ? "left-[68px]" : "left-[260px]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Command className="w-3.5 h-3.5" />
          <span className="font-mono">v2.0</span>
          <span className="px-1.5 py-0.5 rounded-md bg-brand-500/10 text-brand-400 text-[10px] font-bold ring-1 ring-brand-500/20">
            BEAST MODE
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] text-emerald-400 font-medium">All Systems Operational</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
        </button>

        {/* User — links to settings */}
        <Link
          href="/command-center/settings"
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

/* ── Layout ─────────────────────────────────────────────────────── */
export default function CommandCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const demoMode = !isSupabaseConfigured();

  return (
    <div className="min-h-screen bg-[#07070b] text-white font-sans">
      {/* Subtle background mesh */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] h-[50%] w-[40%] rounded-full bg-brand-400/[0.03] blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] h-[50%] w-[35%] rounded-full bg-violet-400/[0.02] blur-[120px]" />
      </div>

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <Topbar sidebarCollapsed={sidebarCollapsed} />

      {/* Demo mode banner — fixed below topbar, above content */}
      <div
        className={`fixed top-14 right-0 z-40 transition-all duration-300 ${
          sidebarCollapsed ? "left-[68px]" : "left-[260px]"
        }`}
      >
        <DemoBanner show={demoMode} />
      </div>

      <main
        className={`relative z-10 min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? "ml-[68px]" : "ml-[260px]"
        } ${demoMode ? "pt-[88px]" : "pt-14"}`}
      >
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
