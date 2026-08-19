"use client";

/**
 * Idle-logout warning banner.
 *
 * THIS IS UX, NOT THE CONTROL. The enforcement lives in `middleware.ts`, which
 * is the only layer that sees the case the founder actually described — close
 * the laptop, come back an hour later, refresh. This component exists so the
 * user is not silently ejected mid-sentence: it counts down, warns, and offers
 * one click to stay. If a user disables JavaScript, kills this component, or
 * edits the countdown, nothing about the actual session lifetime changes.
 *
 * It deliberately reads the SAME signed cookie the middleware writes rather
 * than keeping its own timer, so the banner cannot disagree with the server
 * about when the session ends. It only reads the timestamp half; the signature
 * is the server's business.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import {
  IDLE_COOKIE,
  IDLE_LOGOUT_REASON,
  IDLE_WARNING_MS,
  msUntilIdleLogout,
} from "@/lib/auth/idle-session";

/** Read the timestamp half of the activity cookie. Signature is server-side. */
function readLastActivity(): number | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${IDLE_COOKIE}=`));
  if (!match) return null;
  const value = decodeURIComponent(match.slice(IDLE_COOKIE.length + 1));
  const ts = Number(value.slice(0, value.lastIndexOf(".")));
  return Number.isFinite(ts) && ts > 0 ? ts : null;
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function IdleTimeout() {
  const router = useRouter();
  const [remaining, setRemaining] = useState<number | null>(null);
  // Guards against firing the redirect twice if a tick lands mid-navigation.
  const endedRef = useRef(false);

  /**
   * "Stay signed in" — a real request to a real protected route, so the
   * middleware re-stamps the cookie server-side. A purely local reset would
   * dismiss the banner while the server still expired the session, which is
   * the worst possible outcome: it looks fine and is not.
   */
  const staySignedIn = useCallback(async () => {
    try {
      await fetch("/command-center", { method: "GET", cache: "no-store" });
    } catch {
      // Offline or blocked — the next real navigation re-stamps anyway.
    }
    setRemaining(null);
  }, []);

  useEffect(() => {
    const tick = () => {
      const last = readLastActivity();
      // No cookie yet (first paint after login, or enforcement unavailable in
      // this deployment) — show nothing rather than a countdown we can't back.
      if (last === null) {
        setRemaining(null);
        return;
      }

      const left = msUntilIdleLogout(last, Date.now());

      if (left <= 0 && !endedRef.current) {
        endedRef.current = true;
        // Navigate rather than assert: the middleware clears the session
        // cookies on this request. The client never decides it is signed out.
        router.replace(`/login?reason=${IDLE_LOGOUT_REASON}`);
        return;
      }

      setRemaining(left <= IDLE_WARNING_MS ? left : null);
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [router]);

  if (remaining === null) return null;

  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      aria-labelledby="idle-timeout-title"
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-md rounded-2xl border border-[var(--hs-border)] bg-white p-4 text-[var(--hs-ink)] shadow-lg dark:border-white/[0.08] dark:bg-[#0d0d14] dark:text-white"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-500"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h2 id="idle-timeout-title" className="text-sm font-semibold">
            Signing you out for inactivity
          </h2>
          <p className="mt-1 text-sm text-[var(--hs-ink-secondary)] dark:text-white/60">
            Your session ends in{" "}
            <span className="font-mono font-semibold tabular-nums">
              {formatCountdown(remaining)}
            </span>
            . This is required by NIST 800-171 3.1.11.
          </p>
        </div>
        <button
          type="button"
          onClick={staySignedIn}
          className="flex-shrink-0 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          Stay signed in
        </button>
      </div>
    </div>
  );
}
