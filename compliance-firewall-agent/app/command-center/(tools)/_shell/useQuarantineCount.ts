"use client";

import { useEffect, useState } from "react";

/**
 * The number of quarantine items actually awaiting review, or `null`.
 *
 * `null` is the important half of the contract. It means "we do not know yet"
 * — still loading, request failed, or the caller is not a reviewer — and the
 * caller must render NOTHING in that state.
 *
 * WHY THIS EXISTS: the sidebar shipped `badge: "4"` as a hardcoded string. Every
 * signed-in customer saw a queue of four items regardless of their account,
 * including customers whose queue was empty and customers who had never sent a
 * prompt. On a product sold as C3PAO audit evidence, an invented queue depth is
 * the same class of defect as the seeded overview charts deleted on 2026-07-29
 * and the constant activation checklist fixed on 2026-07-31.
 *
 * Zero is also not a badge. `GET /api/quarantine/review` returns `count: 0` for
 * a healthy queue, and a grey "0" pill is noise on all 23 pages — the absence of
 * a pill already says it. So the hook reports 0 honestly and the sidebar chooses
 * not to draw it.
 *
 * Demo mode is excluded deliberately. The endpoint answers `demo: true` with a
 * seeded list when Supabase is unconfigured; surfacing that as a live count in
 * the customer's chrome would reintroduce exactly the fabricated badge this
 * replaces.
 */
export function useQuarantineCount(): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/quarantine/review", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || data.demo === true) return;
        if (typeof data.count === "number" && Number.isFinite(data.count)) {
          setCount(data.count);
        }
      })
      .catch(() => {
        // Stay null. A failed read means we do not know the queue depth, and a
        // guess here is the bug this hook exists to remove.
      });

    return () => controller.abort();
  }, []);

  return count;
}
