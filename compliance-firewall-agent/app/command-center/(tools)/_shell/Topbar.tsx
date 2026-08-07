"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ChevronDown, Menu } from "lucide-react";

/**
 * The Command Center header.
 *
 * WHAT WAS REMOVED HERE, and why it is not coming back:
 *
 *  1. An "All Systems Operational" pill with a pulsing green dot, hardcoded as a
 *     string and checked against nothing. It read as live status and was a
 *     literal. Wiring it to `/api/health` was considered and rejected twice
 *     over: that route returns `status: "healthy"` as a hardcoded literal of its
 *     own, so the pill would have been the same constant laundered through an
 *     HTTP call; and its `services` block reports HOUNDSHIELD's vendor config
 *     (Stripe keys, Resend, OpenRouter), which is our billing plumbing, not the
 *     customer's security posture, and does not belong in their chrome.
 *     The operator's real gateway status already has an honest home: the
 *     Live/Offline indicator on the overview, which is per-tenant and derived
 *     from their own telemetry.
 *     ponytail: ceiling — no status in the header at all. Upgrade path — a cheap
 *     `GET /api/gateway/status` returning only this tenant's last-event
 *     timestamp would make a real pill affordable here; today the only source is
 *     the full `/api/dashboard/overview` aggregation, and paying for that on all
 *     23 pages to decorate a header is not a trade worth making.
 *
 *  2. A notification bell carrying a permanent red unread dot. Nothing fed the
 *     dot and the button opened nothing — it announced unread news that did not
 *     exist, on every page, forever. A bell that lies is worse than no bell.
 *
 *  3. `useState("K")` as the avatar's initial — a leftover from the Kaelus era.
 *     Every operator saw a stranger's initial until `/api/me` answered. It now
 *     renders nothing until there is a real name, on the same principle as the
 *     company slot below.
 */
export function Topbar({
  sidebarCollapsed,
  onOpenMobileNav,
}: {
  sidebarCollapsed: boolean;
  onOpenMobileNav: () => void;
}) {
  const [userInitial, setUserInitial] = useState<string | null>(null);
  const [company, setCompany] = useState<string | null>(null);

  // Single source for header identity: /api/me resolves the session server-side
  // and returns name-level personalization only (never email or id). Reading the
  // profile straight from the browser client would mean duplicating
  // profileKeyColumn()'s Better-Auth-vs-Supabase column choice out here, where
  // it would silently drift.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => {
        if (cancelled || !me?.authenticated) return;
        if (typeof me.name === "string" && me.name.length > 0) {
          setUserInitial(me.name[0].toUpperCase());
        }
        if (typeof me.company === "string" && me.company.length > 0) {
          setCompany(me.company);
        }
      })
      .catch(() => {
        // Header identity is decoration, never access — the gate in
        // app/command-center/layout.tsx already decided that. Leave the slot
        // empty rather than surfacing an error in the chrome.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-40 h-14 border-b border-[var(--hs-border-ink)] bg-[rgba(250,252,255,0.85)] backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 transition-all duration-300 ${
        sidebarCollapsed ? "lg:left-[68px]" : "lg:left-[260px]"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* The only way to reach navigation below `lg`, where the sidebar is
            off-canvas. Hidden on desktop, where the rail is always present. */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="-ml-1 rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
          <span className="sr-only">Open navigation</span>
        </button>

        {/*
          The signed-in customer's own company, not a build badge. This slot used
          to hold a version string and a swagger label — chrome that told the
          operator nothing about their own account, on a product sold as audit
          evidence. Renders nothing at all until /api/me answers, and nothing when
          the profile has no company set: an empty slot is honest, whereas a
          stand-in org name would be fabricated data on the customer's dashboard.
          Guarded by app/__tests__/dashboard-auth-gate.test.ts, which greps the
          shell — keep the retired label out of comments too.
        */}
        {company && (
          <div className="flex items-center gap-2 text-xs min-w-0">
            <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" aria-hidden="true" />
            <span className="font-medium text-[var(--hs-ink)] truncate">{company}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* User — links to settings. The avatar renders only once there is a
            real initial to put in it; an empty ring beats someone else's letter. */}
        <Link
          href="/command-center/settings"
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          <span className="sr-only">Account settings</span>
          <div
            aria-hidden="true"
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm ${
              userInitial
                ? "bg-gradient-to-br from-brand-500 to-brand-700"
                : "border border-[var(--hs-border-ink)]"
            }`}
          >
            {userInitial}
          </div>
          <ChevronDown className="w-3 h-3 text-slate-500" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
