import Link from "next/link";

/**
 * AuthTabs — the Sign in / Sign up segmented control shared by /login and /signup.
 *
 * One segment is active (a plain, highlighted label); the other links to the
 * sibling auth route, preserving any `?redirect=` target so the post-auth
 * destination survives a switch between the two pages. The routes and their auth
 * handlers are unchanged — this is the visual toggle from the reference design,
 * not a new auth flow.
 */
export function AuthTabs({
  active,
  redirect,
}: {
  active: "signin" | "signup";
  redirect?: string;
}) {
  const q = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";
  const base =
    "flex-1 text-center text-sm font-semibold py-2.5 rounded-lg transition-all";
  const activeCls =
    "bg-white text-[var(--hs-ink)] shadow-sm border border-[var(--hs-border)]";
  const idleCls =
    "text-[var(--hs-ink-secondary)] hover:text-[var(--hs-ink)]";

  return (
    <div className="flex gap-1 p-1 mb-6 rounded-xl border border-[var(--hs-border)] bg-[var(--hs-mist)]/50">
      {active === "signin" ? (
        <span aria-current="page" className={`${base} ${activeCls}`}>
          Sign in
        </span>
      ) : (
        <Link href={`/login${q}`} className={`${base} ${idleCls}`}>
          Sign in
        </Link>
      )}
      {active === "signup" ? (
        <span aria-current="page" className={`${base} ${activeCls}`}>
          Sign up
        </span>
      ) : (
        <Link href={`/signup${q}`} className={`${base} ${idleCls}`}>
          Sign up
        </Link>
      )}
    </div>
  );
}
