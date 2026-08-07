"use client";

import { useEffect, useState } from "react";

export type Viewer = {
  /** First name, when the session has one. Never a stand-in. */
  name: string | null;
  /** The customer's own company, when their profile carries one. */
  company: string | null;
  /**
   * True when `profiles.role` is exactly 'admin'.
   *
   * DECORATION ONLY — it decides whether the founder sees a link, never whether
   * anyone may read anything. `/admin` is protected by the fail-closed server
   * gate in `app/admin/layout.tsx`, which re-resolves the role per request. A
   * customer who forges this flag in devtools gets a link that redirects them
   * straight back to their own dashboard.
   */
  admin: boolean;
};

const EMPTY: Viewer = { name: null, company: null, admin: false };

/**
 * The ONE `/api/me` read in the shell.
 *
 * The header needed the company and the avatar initial; the sidebar then needed
 * the first name to personalize the dashboard label. Two components fetching the
 * same endpoint is two requests on every one of the 23 pages, and two places for
 * the "what counts as a usable name" rule to drift apart.
 *
 * `/api/me` resolves the session server-side and returns name-level
 * personalization only — never the email or the id. Reading the profile straight
 * from the browser client would mean duplicating `profileKeyColumn()`'s
 * Better-Auth-vs-Supabase column choice out here, where it would silently rot.
 *
 * Everything stays null on a failure, and null renders NOTHING at every call
 * site rather than a placeholder. Header identity is decoration, never access —
 * the fail-closed gate in `app/command-center/layout.tsx` already decided that.
 *
 * ponytail: one fetch per mount of the shell, no cache across navigations. The
 * shell layout persists across route changes in the App Router, so this is one
 * request per session in practice, not per page. If that stops holding, the
 * upgrade is a context provider in `layout.tsx` — not a second fetch here.
 */
export function useViewer(): Viewer {
  const [viewer, setViewer] = useState<Viewer>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => {
        if (cancelled || !me?.authenticated) return;
        setViewer({
          name: typeof me.name === "string" && me.name.length > 0 ? me.name : null,
          company: typeof me.company === "string" && me.company.length > 0 ? me.company : null,
          // Exact match only. 'consultant', 'ADMIN' and 'admin ' are not admin —
          // same rule the server gate applies, so the link and the door agree.
          admin: me.role === "admin",
        });
      })
      .catch(() => {
        // Leave the slots empty rather than surfacing an error in the chrome.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return viewer;
}

/**
 * "Sam's Dashboard", or the neutral label when there is no name.
 *
 * Possessive handles a trailing s ("Chris' Dashboard"). Exported so the guard
 * can assert the fallback without mounting the sidebar.
 */
export function dashboardLabel(name: string | null, fallback: string): string {
  if (!name) return fallback;
  return `${name}${name.endsWith("s") ? "'" : "'s"} Dashboard`;
}
