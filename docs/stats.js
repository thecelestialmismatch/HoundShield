import { getDashboardStats } from "../../../lib/supabase";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  // Verify session via Supabase JWT
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Invalid session" });

  // Get user's org membership
  const { data: member, error: memberError } = await supabase
    .from("organization_members")
    .select("org_id, role, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (memberError || !member) return res.status(403).json({ error: "No active membership" });
  if (member.role !== "admin") return res.status(403).json({ error: "Admin access required" });

  try {
    const days = parseInt(req.query.days) || 7;
    const stats = await getDashboardStats(member.org_id, Math.min(days, 90));
    return res.status(200).json(stats);
  } catch (err) {
    console.error("Stats fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
}
