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
  ShieldCheck,
  Target,
  ScrollText,
  Wrench,
  SlidersHorizontal,
  BarChart3,
  Download,
  Map,
  Rocket,
  Home,
  KeyRound,
  Command,
  Crown,
} from "lucide-react";

/**
 * The 23 Command Center destinations — the single source of truth for both the
 * sidebar and the ⌘K palette.
 *
 * Extracted from `layout.tsx` on 2026-08-07 when the shell was split. It is a
 * plain data module on purpose: the palette needs the same list the sidebar
 * renders, and duplicating it is how a destination ends up reachable from one
 * and not the other — the exact defect the founder reported on 2026-07-31, when
 * the dashboard shipped a rival nav.
 *
 * `app/__tests__/operator-dashboard-honesty.test.ts` walks every href here and
 * fails if any lacks a page, so a link can never rot into a 404.
 */
export type NavItem = {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  href: string;
  /**
   * Key of a live count to render as a pill, resolved at render time.
   *
   * Deliberately NOT a literal. This field used to be `badge?: string` holding
   * the hardcoded string "4" on Quarantine, which showed every signed-in
   * customer an invented queue depth on a product sold as audit evidence. A
   * count now comes from the real endpoint or it does not render at all.
   */
  count?: "quarantine";
};

export type NavSection = {
  label: string;
  icon: typeof LayoutDashboard;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Firewall",
    icon: Shield,
    items: [
      // "Dashboard Home" is /command-center itself, which forwards to the
      // overview. It renders OUTSIDE this (tools) route group, which is exactly
      // why the group exists: no double sidebar.
      { id: "home", label: "Dashboard Home", icon: Home, href: "/command-center" },
      { id: "getting-started", label: "Getting Started", icon: Rocket, href: "/command-center/getting-started" },
      // Was href "/command-center" until the 2026-07-29 merge handed that URL
      // to the Live Command Center; this overview kept its content and moved to
      // its own segment.
      { id: "overview", label: "Overview", icon: LayoutDashboard, href: "/command-center/overview" },
      { id: "realtime", label: "Real-Time Feed", icon: Zap, href: "/command-center/realtime" },
      { id: "timeline", label: "Threat Timeline", icon: Activity, href: "/command-center/timeline" },
      { id: "scanner", label: "Live Scanner", icon: Scan, href: "/command-center/scanner" },
      { id: "events", label: "Audit Log", icon: ScrollText, href: "/command-center/events" },
      { id: "quarantine", label: "Quarantine", icon: AlertTriangle, href: "/command-center/quarantine", count: "quarantine" },
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
      { id: "coverage", label: "Coverage Map", icon: Map, href: "/command-center/shield/coverage" },
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
      // Moved from /console/security in the 2026-07-29 merge — it now inherits
      // this shell instead of rendering chrome-less.
      { id: "account-security", label: "Account Security", icon: KeyRound, href: "/command-center/account-security" },
      // Both were TABS inside LiveCommandCenter's own shell until 2026-07-31.
      // That shell stopped being rendered when the dashboard moved into this
      // route group, so without these two entries the panes would have been
      // silently stranded — including Plan & Unlocks, the only upgrade surface
      // in the product.
      { id: "guide", label: "Your Guide", icon: ListChecks, href: "/command-center/guide" },
      { id: "plan", label: "Plan & Unlocks", icon: Crown, href: "/command-center/plan" },
    ],
  },
];

/** Flat list, for the palette and for any guard that walks destinations. */
export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

/**
 * Is `href` the destination the current pathname is on?
 *
 * `/command-center` needs an exact match — a `startsWith` there marks
 * "Dashboard Home" active on all 23 pages, because every one of them is a
 * prefix match.
 */
export function isNavItemActive(href: string, pathname: string): boolean {
  return href === "/command-center" ? pathname === "/command-center" : pathname.startsWith(href);
}
