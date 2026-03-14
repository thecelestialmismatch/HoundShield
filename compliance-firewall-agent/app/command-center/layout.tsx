"use client";

import { useState } from "react";
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
  Brain,
  Bot,
  MessageSquare,
  Database,
  Kanban,
  ListChecks,
  Users,
  Calendar,
  BookMarked,
  Settings,
  ChevronDown,
  Bell,
  Search,
  Menu,
  Command,
  Layers,
  ShieldCheck,
  Target,
  Globe,
  Gamepad2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

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
      { id: "events", label: "Event Log", icon: Globe, href: "/command-center/events" },
      { id: "quarantine", label: "Quarantine", icon: AlertTriangle, href: "/command-center/quarantine", badge: "4" },
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
    label: "AI Agents",
    icon: Brain,
    items: [
      { id: "workspace", label: "Agent Workspace", icon: Brain, href: "/command-center/workspace" },
      { id: "agents", label: "Agent Builder", icon: Bot, href: "/command-center/agents" },
      { id: "chat", label: "AI Chat", icon: MessageSquare, href: "/command-center/chat" },
      { id: "knowledge", label: "Knowledge Base", icon: Database, href: "/command-center/knowledge" },
    ],
  },
  {
    label: "Mission Control",
    icon: Layers,
    items: [
      { id: "pipeline", label: "Content Pipeline", icon: Kanban, href: "/command-center/pipeline" },
      { id: "tasks", label: "Tasks Board", icon: ListChecks, href: "/command-center/tasks" },
      { id: "team", label: "Agent Team", icon: Users, href: "/command-center/team" },
      { id: "calendar", label: "Calendar", icon: Calendar, href: "/command-center/calendar" },
      { id: "memory", label: "Memory DNA", icon: BookMarked, href: "/command-center/memory" },
      { id: "pixeloffice", label: "Pixel Office", icon: Gamepad2, href: "/command-center/pixeloffice" },
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
    "AI Agents": true,
    "Mission Control": false,
  });

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200/80 transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-[260px]"
      }`}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md shadow-blue-600/20 flex-shrink-0 group-hover:shadow-lg transition-shadow">
            <Shield className="w-5 h-5 text-slate-900" strokeWidth={2.5} />
            <Zap className="absolute w-2.5 h-2.5 text-slate-900/90 top-[13px] left-[13px]" strokeWidth={3} fill="currentColor" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <span className="text-lg font-display font-bold tracking-tight text-slate-900">
                Kaelus<span className="text-blue-600">.ai</span>
              </span>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 -mt-0.5 tracking-wider uppercase">
                Command Center
              </span>
            </motion.div>
          )}
        </Link>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 py-3">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/60 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:border-slate-300 transition-colors cursor-pointer">
            <Search className="w-3.5 h-3.5" />
            <span>Search...</span>
            <kbd className="ml-auto text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 dark:text-slate-400 font-mono">
              ⌘K
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
                className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-slate-600 transition-colors ${
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
                              ? "bg-blue-50 text-blue-600"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                          }`}
                          title={collapsed ? label : undefined}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="sidebarActive"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-blue-600"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                            />
                          )}
                          <Icon
                            className={`w-4 h-4 flex-shrink-0 transition-colors ${
                              isActive
                                ? "text-blue-600"
                                : "text-slate-600 dark:text-slate-400 group-hover:text-slate-600"
                            }`}
                          />
                          {!collapsed && (
                            <>
                              <span className="flex-1 truncate">{label}</span>
                              {badge && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-50 text-rose-500 ring-1 ring-rose-200">
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
      <div className="border-t border-slate-100 p-3 space-y-1">
        <Link
          href="/command-center/settings"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-slate-600 dark:text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
        >
          <Settings className="w-4 h-4" />
          {!collapsed && <span>Settings</span>}
        </Link>
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-slate-600 dark:text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
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
  return (
    <header
      className={`fixed top-0 right-0 z-40 h-14 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl flex items-center justify-between px-6 transition-all duration-300 ${
        sidebarCollapsed ? "left-[68px]" : "left-[260px]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Command className="w-3.5 h-3.5" />
          <span className="font-mono">v2.0</span>
          <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold ring-1 ring-blue-200">
            BEAST MODE
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] text-emerald-700 font-medium">All Systems Operational</span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
        </button>

        {/* User */}
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-slate-900 text-xs font-bold shadow-sm">
            K
          </div>
          <ChevronDown className="w-3 h-3 text-slate-600 dark:text-slate-400" />
        </button>
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Subtle background mesh */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] h-[50%] w-[40%] rounded-full bg-blue-400/[0.03] blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] h-[50%] w-[35%] rounded-full bg-violet-400/[0.02] blur-[120px]" />
      </div>

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <Topbar sidebarCollapsed={sidebarCollapsed} />

      <main
        className={`relative z-10 pt-14 min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? "ml-[68px]" : "ml-[260px]"
        }`}
      >
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
