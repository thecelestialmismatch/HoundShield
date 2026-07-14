import { isSupabaseConfigured, createServiceClient } from "@/lib/supabase/client";
import { isBetterAuthEnabled, profileKeyColumn } from "@/lib/auth/auth-config";
import { FOUNDER_TIER, isFounderEmail } from "@/lib/billing/founder-access";

// Matches the CHECK constraint in 004_add_growth_tier.sql
export type SubscriptionTier = "free" | "pro" | "growth" | "enterprise" | "agency";

/**
 * Fetches the active subscription tier for a user.
 *
 * Founder accounts (lib/billing/founder-access — matched on the profile's
 * server-stored email, never client input) resolve to the top tier so every
 * gate built on this check (PDF 402, gateway access) opens without a Stripe
 * subscription existing. The email lookup runs in parallel with the
 * subscription row, so the gate adds no latency; any lookup failure falls
 * back to non-founder (fail closed).
 *
 * Falls back to 'free' when:
 *   - Supabase is not configured (demo mode)
 *   - The subscriptions table doesn't exist yet (migrations pending)
 *   - No active subscription row exists for the user
 */
export async function getUserSubscription(
  userId: string
): Promise<SubscriptionTier> {
  if (!isSupabaseConfigured()) {
    // Demo mode — treat as free so the 402 guard is exercisable in tests
    return "free";
  }

  if (!userId || userId === "anonymous") {
    return "free";
  }

  try {
    const supabase = createServiceClient();
    const [subRes, profileRes] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("tier, status")
        .eq("user_id", userId)
        .in("status", ["active", "trialing"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("email")
        .eq(profileKeyColumn(isBetterAuthEnabled()), userId)
        .maybeSingle(),
    ]);

    if (isFounderEmail(profileRes?.data?.email as string | undefined)) {
      return FOUNDER_TIER;
    }

    const { data, error } = subRes;
    if (error?.code === "42P01") {
      // Table doesn't exist yet — migrations not applied; fail open for now
      console.warn(
        "subscriptions table not found — treating as free. Run migrations."
      );
      return "free";
    }

    return (data?.tier as SubscriptionTier) ?? "free";
  } catch {
    console.error("Subscription check error — defaulting to free tier");
    return "free";
  }
}

/**
 * Returns true when the tier grants gateway access.
 * Free users have no gateway access — they must upgrade.
 */
export function canAccessGateway(tier: SubscriptionTier): boolean {
  return tier !== "free";
}

/**
 * Monthly API scan limit per tier.
 * Enterprise and Agency have no hard limit (Infinity).
 */
export function getApiCallLimit(tier: SubscriptionTier): number {
  const limits: Record<SubscriptionTier, number> = {
    free: 0,
    pro: 50_000,
    growth: 200_000,
    enterprise: Infinity,
    agency: Infinity,
  };
  return limits[tier];
}
