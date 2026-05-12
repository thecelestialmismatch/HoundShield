import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { modelLeaderboard } from "@/lib/gateway/model-leaderboard";

/**
 * GET /api/models/leaderboard
 *
 * Returns the model compliance leaderboard for the authenticated user's org.
 *
 * Query params:
 *   min_requests — exclude models with fewer than N requests (default: 5)
 *   limit        — max entries to return (default: 50)
 *
 * Response:
 *   {
 *     leaderboard: LeaderboardEntry[],
 *     total_models: number,
 *     generated_at: string,
 *   }
 */
export async function GET(request: NextRequest) {
  // Auth check
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const minRequests = Math.max(1, parseInt(searchParams.get("min_requests") ?? "5", 10));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));

  const leaderboard = modelLeaderboard.getLeaderboard(minRequests).slice(0, limit);

  return NextResponse.json(
    {
      leaderboard,
      total_models: modelLeaderboard.getUniqueModelCount(),
      generated_at: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Total-Models": String(modelLeaderboard.getUniqueModelCount()),
      },
    }
  );
}
