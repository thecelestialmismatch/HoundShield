import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { verifyComplianceAnchor } from "@/lib/blockchain/anchor-service";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventId = request.nextUrl.searchParams.get("eventId");
    if (!eventId) {
      return NextResponse.json(
        { error: "eventId is required" },
        { status: 400 }
      );
    }

    const verification = await verifyComplianceAnchor(eventId);

    if (!verification) {
      return NextResponse.json(
        { anchored: false, message: "No blockchain anchor found for this event" },
        { status: 200 }
      );
    }

    return NextResponse.json({
      anchored: true,
      verified: verification.verified,
      txHash: verification.txHash,
      chain: verification.chain,
      blockNumber: verification.blockNumber?.toString() ?? null,
      blockTimestamp: verification.blockTimestamp?.toString() ?? null,
    });
  } catch (error) {
    console.error("Blockchain verification error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
