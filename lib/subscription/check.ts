import { isSupabaseConfigured, createServiceClient } from "@/lib/supabase/client";

// Matches the CHECK constraint in 004_add_growth_tier.sql
export type SubscriptionTier = "free" | "pro" | "growth" | "enterprise" | "agency";

/**
 * Fetches the active subscription tier for a user.
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
    const { data, error } = await supabase
      .from("subscriptions")
      .select("tier, status")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

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
