import type { DashboardViewer } from "@/components/dashboard/LiveCommandCenter";
import {
  FOUNDER_PLAN_LABEL,
  FOUNDER_TIER,
  isFounderEmail,
} from "@/lib/billing/founder-access";

/**
 * Maps a signed-in user's profile to the identity shown in the dashboard
 * sidebar. Pure and unit-tested so the console page stays thin. Returns null
 * when there's nothing identifying — the dashboard then shows its sample org.
 *
 * Founder accounts (see lib/billing/founder-access) are special-cased HERE so
 * every downstream surface stays generic: the founder always gets a viewer
 * (even with no profile row) on the top tier with a "Founder" plan label —
 * full access, no payment path required.
 */

const TIER_LABEL: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  growth: "Growth",
  enterprise: "Enterprise",
  agency: "Agency",
};

/** Two-letter initials from a name: "Vector Defense" -> "VD", "Jordan" -> "JO". */
export function initialsFrom(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export interface ViewerProfile {
  company?: string | null;
  full_name?: string | null;
  tier?: string | null;
}

/** The session identity (server-verified) the founder override keys on. */
export interface ViewerSession {
  email?: string | null;
  name?: string | null;
}

/** First name from a full name: "Jordan Marsh" -> "Jordan". Empty when blank. */
export function firstNameFrom(fullName: string | null | undefined): string {
  return (fullName ?? "").trim().split(/\s+/).filter(Boolean)[0] ?? "";
}

export function buildDashboardViewer(
  profile: ViewerProfile | null,
  session?: ViewerSession | null,
): DashboardViewer | null {
  const founder = isFounderEmail(session?.email);

  // Founder fallbacks: a founder must get a full-access viewer even before a
  // profiles row exists (fresh sign-in, migrations pending, demo env).
  const sessionName = (session?.name ?? "").trim();
  const emailLocal = founder ? (session?.email ?? "").split("@")[0] : "";

  const company = (profile?.company ?? "").trim();
  const name = (profile?.full_name ?? "").trim() || sessionName;
  const label = company || name || (founder ? emailLocal || "HoundShield" : "");
  if (!label) return null;

  const tier = founder
    ? FOUNDER_TIER
    : (profile?.tier ?? "free").trim().toLowerCase() || "free";
  const firstName = firstNameFrom(name);
  return {
    company: label,
    // Raw tier slug — the dashboard resolves it to entitlements (caps, seats,
    // feature gates). `plan` keeps the human label for the sidebar footer.
    tier,
    plan: founder ? FOUNDER_PLAN_LABEL : (TIER_LABEL[tier] ?? "Free"),
    initials: initialsFrom(label) || "HS",
    ...(firstName ? { firstName } : {}),
    ...(founder ? { isFounder: true } : {}),
  };
}
