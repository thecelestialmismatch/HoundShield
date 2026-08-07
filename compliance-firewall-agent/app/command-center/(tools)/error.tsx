"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, ScrollText } from "lucide-react";

/**
 * The error boundary for all 23 Command Center pages.
 *
 * There was none until 2026-08-07 — `app/command-center/` had a `loading.tsx`
 * and nothing else — so any throw inside a tool page escaped to the root
 * `app/error.tsx` and the operator lost the entire shell: no sidebar, no way
 * back, on a full-page error screen that looks like the product broke rather
 * than one panel of it.
 *
 * Placed INSIDE the `(tools)` group on purpose. A boundary here is a child of
 * the group's layout, so React swaps only the page region and the sidebar and
 * header stay on screen: the operator can read the message and click straight
 * to another tool. A boundary one level up would take the shell down with it,
 * which is the failure this replaces.
 *
 * It is not an authorization surface. The fail-closed gate in
 * `app/command-center/layout.tsx` is the parent of this whole subtree and has
 * already run; an anonymous visitor never reaches this file.
 */
export default function CommandCenterToolError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sentry is wired at the app level and picks this up from the console path;
    // logging here keeps the digest next to the operator-visible message so a
    // support conversation can match the two.
    console.error("Command Center tool error:", error);
  }, [error]);

  return (
    <div
      role="alert"
      className="mx-auto max-w-lg rounded-2xl border border-[var(--hs-border-ink)] bg-[var(--hs-surface-0)] p-6 sm:p-8 text-center"
    >
      <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 ring-1 ring-rose-500/20">
        <AlertTriangle className="h-5 w-5 text-rose-400" aria-hidden="true" />
      </div>

      <h1 className="text-lg font-semibold text-[var(--hs-ink)]">This page did not load</h1>

      <p className="mt-2 text-sm text-[var(--hs-ink-secondary)]">
        Something failed while rendering this tool. Your gateway keeps scanning and
        recording regardless — enforcement and the audit log run in your own
        environment, not in this page.
      </p>

      {/* The digest is the only thing that ties this screen to a server log.
          Printing the raw message instead could leak internals to the browser. */}
      {error.digest && (
        <p className="mt-3 font-mono text-[11px] text-[var(--hs-ink-tertiary)]">
          Reference: {error.digest}
        </p>
      )}

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-400"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
        <Link
          href="/command-center/events"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--hs-border-ink)] px-4 py-2 text-sm font-medium text-[var(--hs-ink-secondary)] transition-colors hover:bg-white/5"
        >
          <ScrollText className="h-4 w-4" aria-hidden="true" />
          Open audit log
        </Link>
      </div>
    </div>
  );
}
