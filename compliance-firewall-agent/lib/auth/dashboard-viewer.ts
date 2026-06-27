import type { DashboardViewer } from "@/components/dashboard/LiveCommandCenter";

/**
 * Maps a signed-in user's profile to the identity shown in the dashboard
 * sidebar. Pure and unit-tested so the console page stays thin. Returns null
 * when there's nothing identifying — the dashboard then shows its sample org.
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

export function buildDashboardViewer(profile: ViewerProfile | null): DashboardViewer | null {
  if (!profile) return null;
  const company = (profile.company ?? "").trim();
  const name = (profile.full_name ?? "").trim();
  const label = company || name;
  if (!label) return null;

  const tier = (profile.tier ?? "free").trim().toLowerCase();
  return {
    company: label,
    plan: TIER_LABEL[tier] ?? "Free",
    initials: initialsFrom(label) || "HS",
  };
}
