import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getAnchorStats } from "@/lib/blockchain/anchor-service";
import { isBlockchainEnabled, getAnchorAddress } from "@/lib/blockchain/anchor";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getAnchorStats(user.id);

    return NextResponse.json({
      ...stats,
      anchorAddress: getAnchorAddress(),
      chain: process.env.NODE_ENV === "production" ? "base" : "base-sepolia",
    });
  } catch (error) {
    console.error("Blockchain stats error:", error);
    return NextResponse.json(
      {
        totalAnchored: 0,
        totalVerified: 0,
        blockchainEnabled: isBlockchainEnabled(),
        anchorAddress: null,
        chain: "base-sepolia",
      },
      { status: 200 }
    );
  }
}
