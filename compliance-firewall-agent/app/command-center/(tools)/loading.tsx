/**
 * Skeleton for the page region of the Command Center shell.
 *
 * The existing `app/command-center/loading.tsx` is a full-viewport centred mark.
 * That is right for the first paint of the whole dashboard, and wrong for
 * navigation between tools: it replaced the entire screen — sidebar included —
 * so moving from Overview to Rules made the shell disappear and come back.
 *
 * This one lives inside the `(tools)` group, so React swaps only the content
 * region. The sidebar and header stay put and the layout does not jump: the
 * block sizes below match the page header and panel grid the tools actually
 * render.
 */
export default function CommandCenterToolLoading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>

      {/* Page header */}
      <div className="h-7 w-56 rounded-lg bg-white/5" />
      <div className="mt-2 h-4 w-80 max-w-full rounded bg-white/5" />

      {/* KPI row — 2 up on a phone, 3 from `sm`, 6 on a wide desktop, matching
          the `.kpis.k6` breakpoints in lccStyles.ts so nothing reflows on swap. */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl border border-[var(--hs-border-ink)] bg-white/[0.03]"
          />
        ))}
      </div>

      {/* Chart row */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="h-64 rounded-xl border border-[var(--hs-border-ink)] bg-white/[0.03] lg:col-span-3" />
        <div className="h-64 rounded-xl border border-[var(--hs-border-ink)] bg-white/[0.03] lg:col-span-2" />
      </div>
    </div>
  );
}
