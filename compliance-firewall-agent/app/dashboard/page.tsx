"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ComplianceOverview } from "@/components/dashboard/compliance-overview";
import { EventTable } from "@/components/dashboard/event-table";
import { QuarantinePanel } from "@/components/dashboard/quarantine-panel";
import { AIChat } from "@/components/dashboard/ai-chat";
import { AgentBuilder } from "@/components/dashboard/agent-builder";
import { LiveScanner } from "@/components/dashboard/live-scanner";
import { ThreatTimeline } from "@/components/dashboard/threat-timeline";
import { RealtimeFeed } from "@/components/dashboard/realtime-feed";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { DemoBanner } from "@/components/ui/demo-banner";
import {
  Shield,
  LayoutDashboard,
  Activity,
  AlertTriangle,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Globe,
  Clock,
  Zap,
  MessageSquare,
  Bot,
  Scan,
  BookOpen,
  ExternalLink,
} from "lucide-react";

type Tab = "overview" | "events" | "quarantine" | "chat" | "agents" | "scanner" | "timeline" | "realtime" | "settings";

const NAV_ITEMS: { id: Tab; label: string; icon: typeof LayoutDashboard; badge?: string; section?: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, section: "Dashboard" },
  { id: "realtime", label: "Real-Time Feed", icon: Zap, section: "Dashboard" },
  { id: "timeline", label: "Threat Timeline", icon: Activity, section: "Dashboard" },
  { id: "events", label: "Event Log", icon: Activity, section: "Compliance" },
  { id: "quarantine", label: "Quarantine", icon: AlertTriangle, badge: "4", section: "Compliance" },
  { id: "scanner", label: "Live Scanner", icon: Scan, section: "Compliance" },
  { id: "chat", label: "AI Chat", icon: MessageSquare, section: "AI Tools" },
  { id: "agents", label: "Agent Builder", icon: Bot, section: "AI Tools" },
  { id: "settings", label: "Settings", icon: Settings, section: "System" },
];

function SettingsPanel() {
  const [apiKey] = useState("kael_sk_demo_*****");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [autoBlock, setAutoBlock] = useState(true);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Settings</h2>
        <p className="text-sm text-white/40">Configure your Kaelus compliance firewall.</p>
      </div>

      {/* API Key */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-medium text-white">API Configuration</h3>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Gateway API Key</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={apiKey}
              readOnly
              className="flex-1 bg-surface-100 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/60 font-mono"
            />
            <button
              onClick={() => navigator.clipboard?.writeText(apiKey)}
              className="btn-ghost text-xs px-3"
            >
              Copy
            </button>
          </div>
          <p className="text-[11px] text-white/25 mt-1">Use this key in the x-api-key header for gateway requests.</p>
        </div>

        <div>
          <label className="block text-xs text-white/40 mb-1.5">Gateway Endpoint</label>
          <input
            type="text"
            value={typeof window !== "undefined" ? `${window.location.origin}/api/gateway/intercept` : "/api/gateway/intercept"}
            readOnly
            className="w-full bg-surface-100 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/60 font-mono"
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-medium text-white">Notifications</h3>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Slack Webhook URL</label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
            className="w-full bg-surface-100 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:border-brand-500/50 focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/70">Email Notifications</p>
            <p className="text-xs text-white/30">Get notified on critical events</p>
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
            className={`w-10 h-6 rounded-full transition-colors relative ${notifications ? "bg-brand-500" : "bg-white/10"}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${notifications ? "left-5" : "left-1"}`} />
          </button>
        </div>
      </div>

      {/* Policy */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-medium text-white">Policy Rules</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/70">Auto-block Critical Risks</p>
            <p className="text-xs text-white/30">Automatically block CRITICAL risk requests</p>
          </div>
          <button
            onClick={() => setAutoBlock(!autoBlock)}
            className={`w-10 h-6 rounded-full transition-colors relative ${autoBlock ? "bg-danger" : "bg-white/10"}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${autoBlock ? "left-5" : "left-1"}`} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/70">Quarantine HIGH Risk</p>
            <p className="text-xs text-white/30">Send HIGH risk items for human review</p>
          </div>
          <button className="w-10 h-6 rounded-full bg-warning relative cursor-default">
            <div className="w-4 h-4 rounded-full bg-white absolute top-1 left-5" />
          </button>
        </div>
      </div>

      <button onClick={handleSave} className="btn-primary px-6 py-2.5">
        {saved ? "Saved!" : "Save Settings"}
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  // Live clock
  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString());
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Group nav items by section
  const sections = NAV_ITEMS.reduce<Record<string, typeof NAV_ITEMS>>((acc, item) => {
    const section = item.section || "Other";
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Demo mode banner */}
      <DemoBanner />

      <div className="flex flex-1">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface-50 border-r border-white/[0.06] flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20">
            <Shield className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <span className="text-base font-bold text-white tracking-tight block leading-tight">Kaelus</span>
            <span className="text-[10px] text-white/25 uppercase tracking-widest">AI Platform</span>
          </div>
        </div>

        {/* System Status */}
        <div className="mx-3 mt-3 mb-1 p-3 rounded-lg bg-success/5 border border-success/10">
          <div className="flex items-center gap-2 mb-1">
            <span className="status-dot" style={{ width: 6, height: 6 }} />
            <span className="text-[11px] font-medium text-success">System Active</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-white/30">
            <span className="flex items-center gap-1"><Zap className="w-3 h-3" />12ms avg</span>
            <span className="flex items-center gap-1"><Globe className="w-3 h-3" />3 providers</span>
          </div>
        </div>

        {/* Nav - Grouped by section */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {Object.entries(sections).map(([sectionName, items]) => (
            <div key={sectionName}>
              <p className="text-[9px] font-medium text-white/20 uppercase tracking-widest px-3 mb-1.5">{sectionName}</p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`${isActive ? "nav-item-active" : "nav-item"} w-full`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto text-[10px] bg-warning-muted text-warning px-1.5 py-0.5 rounded-full font-medium">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* API Docs Link */}
          <div>
            <p className="text-[9px] font-medium text-white/20 uppercase tracking-widest px-3 mb-1.5">Resources</p>
            <Link href="/docs" className="nav-item w-full">
              <BookOpen className="w-4 h-4" />
              <span>API Docs</span>
              <ExternalLink className="w-3 h-3 ml-auto text-white/20" />
            </Link>
          </div>
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-white/[0.06] space-y-1">
          <Link href="/" className="nav-item w-full">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Link>
        </div>

        {/* User */}
        <div className="p-4 border-t border-white/[0.06] flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center text-sm font-semibold text-brand-300 border border-brand-500/10">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Admin</p>
            <p className="text-xs text-white/40 truncate">admin@kaelus.ai</p>
          </div>
          <ChevronDown className="w-4 h-4 text-white/20" />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 bg-surface/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-medium text-white/70">
              {NAV_ITEMS.find((n) => n.id === activeTab)?.label ?? "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
            </button>

            {/* Clock */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-white/30">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono">{currentTime}</span>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 text-sm">
              <span className="status-dot" />
              <span className="text-success text-xs font-medium">Protected</span>
            </div>
          </div>
        </header>

        {/* Search bar */}
        {searchOpen && (
          <div className="px-5 pt-4">
            <div className="glass-card p-1 flex items-center">
              <Search className="w-4 h-4 text-white/30 ml-3" />
              <input
                type="text"
                placeholder="Search events, users, entities..."
                autoFocus
                className="flex-1 bg-transparent border-none px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="p-2 text-white/30 hover:text-white/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="p-5 lg:p-8 max-w-7xl">
          {activeTab === "overview" && (
            <ErrorBoundary fallbackTitle="Overview failed to load">
              <ComplianceOverview />
            </ErrorBoundary>
          )}
          {activeTab === "realtime" && (
            <ErrorBoundary fallbackTitle="Real-time feed failed to load">
              <div className="h-[calc(100vh-10rem)]">
                <RealtimeFeed />
              </div>
            </ErrorBoundary>
          )}
          {activeTab === "timeline" && (
            <ErrorBoundary fallbackTitle="Timeline failed to load">
              <ThreatTimeline />
            </ErrorBoundary>
          )}
          {activeTab === "events" && (
            <ErrorBoundary fallbackTitle="Event log failed to load">
              <EventTable />
            </ErrorBoundary>
          )}
          {activeTab === "quarantine" && (
            <ErrorBoundary fallbackTitle="Quarantine panel failed to load">
              <QuarantinePanel />
            </ErrorBoundary>
          )}
          {activeTab === "scanner" && (
            <ErrorBoundary fallbackTitle="Scanner failed to load">
              <LiveScanner />
            </ErrorBoundary>
          )}
          {activeTab === "chat" && (
            <ErrorBoundary fallbackTitle="AI Chat failed to load">
              <AIChat />
            </ErrorBoundary>
          )}
          {activeTab === "agents" && (
            <ErrorBoundary fallbackTitle="Agent Builder failed to load">
              <AgentBuilder />
            </ErrorBoundary>
          )}
          {activeTab === "settings" && (
            <ErrorBoundary fallbackTitle="Settings failed to load">
              <SettingsPanel />
            </ErrorBoundary>
          )}
        </main>
      </div>
      </div>
    </div>
  );
}
