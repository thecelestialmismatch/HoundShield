"use client";

import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/Logo";
import { TextLogo } from "@/components/TextLogo";
import { ComplianceOverview } from "@/components/dashboard/compliance-overview";
import { EventTable } from "@/components/dashboard/event-table";
import { QuarantinePanel } from "@/components/dashboard/quarantine-panel";
import { AIChat } from "@/components/dashboard/ai-chat";
import { AgentBuilder } from "@/components/dashboard/agent-builder";
import { LiveScanner } from "@/components/dashboard/live-scanner";
import { ThreatTimeline } from "@/components/dashboard/threat-timeline";
import { RealtimeFeed } from "@/components/dashboard/realtime-feed";
import AgentWorkspace from "@/components/dashboard/agent-workspace";
import KnowledgeBase from "@/components/dashboard/knowledge-base";
import ContentPipeline from "@/components/dashboard/content-pipeline";
import TasksBoard from "@/components/dashboard/tasks-board";
import TeamView from "@/components/dashboard/team-view";
import CalendarView from "@/components/dashboard/calendar-view";
import MemoryView from "@/components/dashboard/memory-view";
import { PixelOffice } from "@/components/dashboard/pixel-office/pixel-office";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { DemoBanner } from "@/components/ui/demo-banner";
import { UserDropdown } from "@/components/dashboard/user-dropdown";
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
  Key,
  Save,
  CheckCircle,
  Brain,
  Database,
  Kanban,
  ListChecks,
  Users,
  Calendar,
  BookMarked,
  Github,
  Chrome,
  Sparkles,
  Lock,
  Mail,
  Gamepad2,
} from "lucide-react";

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function MicrosoftLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 21 21">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

type Tab =
  | "overview"
  | "events"
  | "quarantine"
  | "chat"
  | "agents"
  | "scanner"
  | "timeline"
  | "realtime"
  | "settings"
  | "workspace"
  | "knowledge"
  | "pipeline"
  | "tasks"
  | "team"
  | "calendar"
  | "memory"
  | "pixeloffice";

const NAV_ITEMS: { id: Tab; label: string; icon: typeof LayoutDashboard; badge?: string; section?: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, section: "Dashboard" },
  { id: "realtime", label: "Real-Time Feed", icon: Zap, section: "Dashboard" },
  { id: "timeline", label: "Threat Timeline", icon: Activity, section: "Dashboard" },
  { id: "events", label: "Event Log", icon: Activity, section: "Compliance" },
  { id: "quarantine", label: "Quarantine", icon: AlertTriangle, badge: "4", section: "Compliance" },
  { id: "scanner", label: "Live Scanner", icon: Scan, section: "Compliance" },
  { id: "workspace", label: "Agent Workspace", icon: Brain, section: "AI Agents" },
  { id: "agents", label: "Agent Builder", icon: Bot, section: "AI Agents" },
  { id: "chat", label: "AI Chat", icon: MessageSquare, section: "AI Agents" },
  { id: "knowledge", label: "Knowledge Base", icon: Database, section: "AI Agents" },
  { id: "pixeloffice", label: "Pixel Office", icon: Gamepad2, section: "AI Agents" },
  { id: "pipeline", label: "Content Pipeline", icon: Kanban, section: "Mission Control" },
  { id: "tasks", label: "Tasks Board", icon: ListChecks, section: "Mission Control" },
  { id: "team", label: "Agent Team", icon: Users, section: "Mission Control" },
  { id: "calendar", label: "Calendar", icon: Calendar, section: "Mission Control" },
  { id: "memory", label: "Memory DNA", icon: BookMarked, section: "Mission Control" },
  { id: "settings", label: "Settings", icon: Settings, section: "System" },
];

// ---------------------------------------------------------------------------
// Auth Modal
// ---------------------------------------------------------------------------
function AuthModal({ onClose, onAuth }: { onClose: () => void; onAuth: (user: { name: string; email: string; avatar: string; provider: string }) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSocialAuth = (provider: string) => {
    // Simulate OAuth
    onAuth({
      name: provider === "google" ? "User" : "Developer",
      email: provider === "google" ? "user@gmail.com" : "dev@github.com",
      avatar: provider === "google" ? "G" : "D",
      provider,
    });
  };

  const handleEmailAuth = () => {
    if (!email.trim()) return;
    onAuth({
      name: name || email.split("@")[0],
      email,
      avatar: (name || email)[0].toUpperCase(),
      provider: "email",
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md mx-4 bg-[#111114] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 pb-4 text-center border-b border-white/[0.06]">
          <Logo className="w-12 h-12 rounded-2xl mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-sm text-white/40 mt-1">
            {mode === "login" ? "Sign in to Kaelus AI Platform" : "Join the most powerful AI platform"}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Email Form */}
          <div className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="block text-[11px] text-white/40 mb-1.5 uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-[#0c0c10] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-indigo-500/50 focus:outline-none transition-all"
                />
              </div>
            )}
            <div>
              <label className="block text-[11px] text-white/40 mb-1.5 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#0c0c10] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-indigo-500/50 focus:outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-white/40 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0c0c10] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-indigo-500/50 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleEmailAuth}
            className="w-full btn-primary py-3 text-sm"
          >
            <Sparkles className="w-4 h-4" />
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[11px] text-white/25 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Social Auth */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleSocialAuth("google")}
              className="flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white/80 font-medium hover:bg-white/[0.08] hover:border-white/[0.12] active:scale-[0.98] transition-all duration-200"
            >
              <GoogleLogo className="w-4 h-4" />
              Continue with Google
            </button>
            <button
              onClick={() => handleSocialAuth("microsoft")}
              className="flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white/80 font-medium hover:bg-white/[0.08] hover:border-white/[0.12] active:scale-[0.98] transition-all duration-200"
            >
              <MicrosoftLogo className="w-4 h-4" />
              Continue with Microsoft
            </button>
            <button
              onClick={() => handleSocialAuth("github")}
              className="flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white/80 font-medium hover:bg-white/[0.08] hover:border-white/[0.12] active:scale-[0.98] transition-all duration-200"
            >
              <Github className="w-4 h-4" />
              Continue with GitHub
            </button>
            <button
              onClick={() => handleSocialAuth("sso")}
              className="flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white/80 font-medium hover:bg-white/[0.08] hover:border-white/[0.12] active:scale-[0.98] transition-all duration-200"
            >
              <Shield className="w-4 h-4" />
              Continue with SSO
            </button>
          </div>

          <p className="text-center text-xs text-white/30 pt-1">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {mode === "login" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings Panel
// ---------------------------------------------------------------------------

function SettingsPanel() {
  const [apiKey] = useState("kael_sk_demo_*****");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [autoBlock, setAutoBlock] = useState(true);
  const [saved, setSaved] = useState(false);
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [keyStatus, setKeyStatus] = useState<"unknown" | "checking" | "valid" | "invalid">("unknown");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kaelus-settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.webhookUrl) setWebhookUrl(parsed.webhookUrl);
        if (parsed.notifications !== undefined) setNotifications(parsed.notifications);
        if (parsed.autoBlock !== undefined) setAutoBlock(parsed.autoBlock);
      }
      const savedKey = localStorage.getItem("kaelus_openrouter_key");
      if (savedKey) setOpenrouterKey(savedKey);
    } catch { }
  }, []);

  const testKey = async () => {
    if (!openrouterKey.trim()) return;
    setKeyStatus("checking");
    try {
      const res = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${openrouterKey}` },
      });
      if (res.ok) {
        setKeyStatus("valid");
        localStorage.setItem("kaelus_openrouter_key", openrouterKey);
      } else {
        setKeyStatus("invalid");
      }
    } catch {
      setKeyStatus("invalid");
    }
  };

  function handleSave() {
    try {
      localStorage.setItem("kaelus-settings", JSON.stringify({ webhookUrl, notifications, autoBlock }));
      if (openrouterKey.trim()) {
        localStorage.setItem("kaelus_openrouter_key", openrouterKey);
      }
    } catch { }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Settings</h2>
        <p className="text-sm text-white/40">Configure your Kaelus AI platform.</p>
      </div>

      {/* API Key */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-indigo-400" />
          API Configuration
        </h3>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Gateway API Key</label>
          <div className="flex gap-2">
            <input type="text" value={apiKey} readOnly className="flex-1 bg-[#0c0c10] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/60 font-mono" />
            <button onClick={() => navigator.clipboard?.writeText(apiKey)} className="btn-ghost text-xs px-3">Copy</button>
          </div>
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Gateway Endpoint</label>
          <input
            type="text"
            value={typeof window !== "undefined" ? `${window.location.origin}/api/gateway/intercept` : "/api/gateway/intercept"}
            readOnly
            className="w-full bg-[#0c0c10] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/60 font-mono"
          />
        </div>
      </div>

      {/* OpenRouter API Key */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          AI Models (OpenRouter) — 8 Free + 5 Paid Models
        </h3>
        <p className="text-xs text-white/30">
          AI Chat & Agent Workspace use OpenRouter for 200+ AI models. Get a free API key at{" "}
          <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline hover:text-indigo-300">openrouter.ai/keys</a>
        </p>
        <div className="flex flex-wrap gap-1.5 text-[10px]">
          {["Gemini Flash", "Llama 3.3 70B", "DeepSeek V3", "Qwen 2.5 72B", "Mistral Small", "Gemma 3 27B", "Nemotron 70B", "Phi-4 Reasoning+"].map(m => (
            <span key={m} className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">FREE {m}</span>
          ))}
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">OpenRouter API Key</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={openrouterKey}
              onChange={(e) => { setOpenrouterKey(e.target.value); setKeyStatus("unknown"); }}
              placeholder="sk-or-v1-..."
              className="flex-1 bg-[#0c0c10] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:border-indigo-500/50 focus:outline-none transition-all font-mono"
            />
            <button onClick={testKey} className="btn-ghost text-xs px-3" disabled={!openrouterKey.trim()}>
              {keyStatus === "checking" ? "Testing..." : "Test & Save"}
            </button>
          </div>
          {keyStatus === "valid" && (
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Key saved and valid! All 13 AI models are active.
            </p>
          )}
          {keyStatus === "invalid" && (
            <p className="text-[11px] text-red-400 mt-1">Invalid key. Check and try again.</p>
          )}
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
            className="w-full bg-[#0c0c10] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:border-indigo-500/50 focus:outline-none transition-all"
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/70">Email Notifications</p>
            <p className="text-xs text-white/30">Get notified on critical events</p>
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
            className={`w-10 h-6 rounded-full transition-colors relative ${notifications ? "bg-indigo-500" : "bg-white/10"}`}
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
            className={`w-10 h-6 rounded-full transition-colors relative ${autoBlock ? "bg-red-500" : "bg-white/10"}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${autoBlock ? "left-5" : "left-1"}`} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/70">Quarantine HIGH Risk</p>
            <p className="text-xs text-white/30">Send HIGH risk items for human review</p>
          </div>
          <button className="w-10 h-6 rounded-full bg-amber-500 relative cursor-default">
            <div className="w-4 h-4 rounded-full bg-white absolute top-1 left-5" />
          </button>
        </div>
      </div>

      <button onClick={handleSave} className="btn-primary px-6 py-2.5 flex items-center gap-2">
        <Save className="w-4 h-4" />
        {saved ? "Saved!" : "Save Settings"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; avatar: string; provider: string } | null>(null);

  // Agent → Chat state
  const [agentChat, setAgentChat] = useState<{
    name: string;
    systemPrompt: string;
    model: string;
  } | null>(null);

  // Agent → Workspace state
  const [workspaceAgent, setWorkspaceAgent] = useState<{
    name: string;
    systemPrompt: string;
    model: string;
    tools: string[];
    temperature: number;
  } | null>(null);

  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString());
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("kaelus_user");
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch { }
  }, []);

  const sections = NAV_ITEMS.reduce<Record<string, typeof NAV_ITEMS>>((acc, item) => {
    const section = item.section || "Other";
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {});

  const handleChatWithAgent = useCallback(
    (agent: { name: string; systemPrompt: string; model: string }) => {
      setAgentChat(agent);
      setActiveTab("chat");
    },
    []
  );

  const handleLaunchWorkspace = useCallback(
    (agent: { name: string; systemPrompt: string; model: string; tools: string[]; temperature: number }) => {
      setWorkspaceAgent(agent);
      setActiveTab("workspace");
    },
    []
  );

  const handleTabChange = useCallback(
    (tab: Tab) => {
      if (tab !== "chat") setAgentChat(null);
      if (tab !== "workspace") setWorkspaceAgent(null);
      setActiveTab(tab);
      setSidebarOpen(false);
    },
    []
  );

  const handleAuth = (userData: { name: string; email: string; avatar: string; provider: string }) => {
    setUser(userData);
    setShowAuth(false);
    try { localStorage.setItem("kaelus_user", JSON.stringify(userData)); } catch { }
  };

  const handleLogout = () => {
    setUser(null);
    try { localStorage.removeItem("kaelus_user"); } catch { }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const lower = query.toLowerCase();
    if (lower.includes("event") || lower.includes("log")) handleTabChange("events");
    else if (lower.includes("quarantine") || lower.includes("review")) handleTabChange("quarantine");
    else if (lower.includes("scan")) handleTabChange("scanner");
    else if (lower.includes("agent") && lower.includes("build")) handleTabChange("agents");
    else if (lower.includes("workspace") || lower.includes("agentic")) handleTabChange("workspace");
    else if (lower.includes("chat") || lower.includes("ai")) handleTabChange("chat");
    else if (lower.includes("knowledge") || lower.includes("doc")) handleTabChange("knowledge");
    else if (lower.includes("pipeline") || lower.includes("content")) handleTabChange("pipeline");
    else if (lower.includes("task") || lower.includes("board")) handleTabChange("tasks");
    else if (lower.includes("team") || lower.includes("agent")) handleTabChange("team");
    else if (lower.includes("calendar") || lower.includes("schedule")) handleTabChange("calendar");
    else if (lower.includes("memory") || lower.includes("dna") || lower.includes("lesson")) handleTabChange("memory");
    else if (lower.includes("pixel") || lower.includes("office") || lower.includes("game")) handleTabChange("pixeloffice");
    else if (lower.includes("setting") || lower.includes("config") || lower.includes("key")) handleTabChange("settings");
    else if (lower.includes("real") || lower.includes("live") || lower.includes("feed")) handleTabChange("realtime");
    setSearchOpen(false);
    setSearchQuery("");
  };

  const getPageTitle = () => {
    if (activeTab === "chat" && agentChat) return `AI Chat — ${agentChat.name}`;
    if (activeTab === "workspace" && workspaceAgent) return `Agent: ${workspaceAgent.name}`;
    return NAV_ITEMS.find((n) => n.id === activeTab)?.label ?? "Dashboard";
  };

  const fullWidthTabs = ["workspace"];

  return (
    <div className="min-h-screen bg-[#0c0c10] flex flex-col">
      <DemoBanner />

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={handleAuth} />}

      <div className="flex flex-1">
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0a0d]/80 backdrop-blur-2xl border-r border-white/[0.06] flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          {/* Logo */}
          <Link href="/" className="h-16 flex items-center gap-2.5 px-5 border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors group">
            <Logo className="w-9 h-9 group-hover:border-brand-500/40 transition-colors" />
            <div>
              <TextLogo />
              <span className="text-[10px] text-white/25 uppercase tracking-widest">AI Platform</span>
            </div>
          </Link>

          {/* System Status */}
          <div className="mx-3 mt-3 mb-1 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="status-dot" style={{ width: 6, height: 6 }} />
              <span className="text-[11px] font-medium text-emerald-400">System Active</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-white/30">
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" />12ms avg</span>
              <span className="flex items-center gap-1"><Globe className="w-3 h-3" />13 models</span>
            </div>
          </div>

          {/* Nav */}
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
                        onClick={() => handleTabChange(item.id)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 w-full ${
                          isActive
                            ? "bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] relative overflow-hidden"
                            : "text-white/40 hover:text-white/80 hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-full font-medium">{item.badge}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div>
              <p className="text-[9px] font-medium text-white/20 uppercase tracking-widest px-3 mb-1.5">Resources</p>
              <Link href="/docs" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 w-full text-white/40 hover:text-white/80 hover:bg-white/5 border border-transparent">
                <BookOpen className="w-4 h-4" />
                <span>API Docs</span>
                <ExternalLink className="w-3 h-3 ml-auto text-white/20" />
              </Link>
            </div>
          </nav>

          <div className="p-3 border-t border-white/[0.06] space-y-1">
            <Link href="/" className="nav-item w-full">
              <LogOut className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* User Section */}
          <div className="p-3 border-t border-white/[0.06]">
            {user ? (
              <UserDropdown user={user} onLogout={handleLogout} />
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => handleAuth({ name: "Demo User", email: "demo@kaelus.ai", avatar: "", provider: "demo" })}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/15 transition-all"
                >
                  <Zap className="w-4 h-4" style={{ fill: "currentColor" }} />
                  Demo Login
                </button>
                <button
                  onClick={() => setShowAuth(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium hover:bg-indigo-500/15 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Sign In / Join Now
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 lg:ml-64 flex flex-col">
          {/* Top header */}
          <header className="sticky top-0 z-30 h-16 bg-[#0c0c10]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-5">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors">
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-sm font-medium text-white/70">{getPageTitle()}</h1>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                <Search className="w-4 h-4" />
              </button>
              <button className="relative p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-xs text-white/30">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-mono">{currentTime}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="status-dot" />
                <span className="text-emerald-400 text-xs font-medium">Protected</span>
              </div>
              {!user && (
                <button
                  onClick={() => setShowAuth(true)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium hover:bg-indigo-500/15 transition-all"
                >
                  <Sparkles className="w-3 h-3" />
                  Join Now
                </button>
              )}
            </div>
          </header>

          {/* Search bar */}
          {searchOpen && (
            <div className="px-5 pt-4">
              <div className="glass-card p-1 flex items-center">
                <Search className="w-4 h-4 text-white/30 ml-3" />
                <input
                  type="text"
                  placeholder="Search events, agents, tasks, memory... or jump to a tab"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) handleSearch(searchQuery);
                    if (e.key === "Escape") setSearchOpen(false);
                  }}
                  className="flex-1 bg-transparent border-none px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none"
                />
                <button onClick={() => setSearchOpen(false)} className="p-2 text-white/30 hover:text-white/60">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Page content */}
          <main className={`flex-1 relative ${fullWidthTabs.includes(activeTab) ? '' : 'p-5 lg:p-8 max-w-7xl'}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full w-full"
              >
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
            {activeTab === "workspace" && (
              <ErrorBoundary fallbackTitle="Agent Workspace failed to load">
                <div className="h-[calc(100vh-4rem)]">
                  {workspaceAgent ? (
                    <AgentWorkspace
                      key={`ws-${workspaceAgent.name}-${Date.now()}`}
                      agentName={workspaceAgent.name}
                      agentSystemPrompt={workspaceAgent.systemPrompt}
                      agentModel={workspaceAgent.model}
                      agentTools={workspaceAgent.tools}
                      agentTemperature={workspaceAgent.temperature}
                    />
                  ) : (
                    <AgentWorkspace />
                  )}
                </div>
              </ErrorBoundary>
            )}
            {activeTab === "chat" && (
              <ErrorBoundary fallbackTitle="AI Chat failed to load">
                {agentChat ? (
                  <AIChat
                    key={`agent-${agentChat.name}`}
                    initialSystemPrompt={agentChat.systemPrompt}
                    initialModel={agentChat.model}
                    agentName={agentChat.name}
                  />
                ) : (
                  <AIChat />
                )}
              </ErrorBoundary>
            )}
            {activeTab === "agents" && (
              <ErrorBoundary fallbackTitle="Agent Builder failed to load">
                <AgentBuilder
                  onChatWithAgent={handleChatWithAgent}
                  onLaunchWorkspace={handleLaunchWorkspace}
                />
              </ErrorBoundary>
            )}
            {activeTab === "knowledge" && (
              <ErrorBoundary fallbackTitle="Knowledge Base failed to load">
                <div className="h-[calc(100vh-10rem)] relative">
                  <KnowledgeBase />
                </div>
              </ErrorBoundary>
            )}
            {activeTab === "pipeline" && (
              <ErrorBoundary fallbackTitle="Content Pipeline failed to load">
                <ContentPipeline />
              </ErrorBoundary>
            )}
            {activeTab === "tasks" && (
              <ErrorBoundary fallbackTitle="Tasks Board failed to load">
                <TasksBoard />
              </ErrorBoundary>
            )}
            {activeTab === "team" && (
              <ErrorBoundary fallbackTitle="Team view failed to load">
                <TeamView />
              </ErrorBoundary>
            )}
            {activeTab === "calendar" && (
              <ErrorBoundary fallbackTitle="Calendar failed to load">
                <CalendarView />
              </ErrorBoundary>
            )}
            {activeTab === "memory" && (
              <ErrorBoundary fallbackTitle="Memory DNA failed to load">
                <MemoryView />
              </ErrorBoundary>
            )}
            {activeTab === "pixeloffice" && (
              <ErrorBoundary fallbackTitle="Pixel Office failed to load">
                <div className="h-[calc(100vh-10rem)]">
                  <PixelOffice />
                </div>
              </ErrorBoundary>
            )}
            {activeTab === "settings" && (
              <ErrorBoundary fallbackTitle="Settings failed to load">
                <SettingsPanel />
              </ErrorBoundary>
            )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
