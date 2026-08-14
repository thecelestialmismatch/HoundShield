import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { verifyUnsubscribeToken } from "@/lib/legal/marketing-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-click unsubscribe from onboarding email.
 *
 * CAN-SPAM 15 U.S.C. §7704(a)(3) requires the opt-out mechanism to work for at
 * least 30 days after sending and to need nothing from the recipient beyond a
 * reply or a single visit. So this endpoint is deliberately:
 *
 *   • UNAUTHENTICATED — requiring a login to stop receiving mail is exactly the
 *     "additional obligation" the statute forbids, and the recipient may have
 *     no account password at all.
 *   • Authorised by a signed token instead, verified in constant time, so being
 *     unauthenticated does not mean anyone can unsubscribe anyone.
 *   • Answering GET **and** POST. GET is the link a human clicks; POST is
 *     RFC 8058 one-click, which is what Gmail and Yahoo actually invoke on
 *     behalf of the user.
 *   • Idempotent. Unsubscribing twice is success, not an error — a provider may
 *     retry the POST.
 *
 * §7704(a)(4) puts a 10-business-day clock on honouring an opt-out. Recording
 * it synchronously here means the clock is never a factor.
 */

/** A recipient who asked to stop should never see a stack trace. */
function page(title: string, body: string, status = 200): NextResponse {
  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${title} — HoundShield</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:48px 20px;color:#0f172a;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
    <h1 style="margin:0 0 12px;font-size:20px;">${title}</h1>
    <p style="margin:0;color:#475569;line-height:1.6;font-size:14px;">${body}</p>
  </div>
</body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
  );
}

async function unsubscribe(req: NextRequest): Promise<NextResponse> {
  const userId = req.nextUrl.searchParams.get("u") ?? "";
  const token = req.nextUrl.searchParams.get("t") ?? "";

  if (!userId || !verifyUnsubscribeToken(userId, token)) {
    // Deliberately vague: a precise error would confirm whether an id exists.
    return page(
      "This link is not valid",
      "The unsubscribe link is incomplete or has been altered. Reply to any HoundShield email and a human will remove you.",
      400,
    );
  }

  if (!isSupabaseConfigured()) {
    // Fail LOUD, not silently "unsubscribed" — telling someone they are opted
    // out when nothing was recorded is the one outcome worse than an error.
    return page(
      "We could not record that right now",
      "Something went wrong on our side and your request was not saved. Please reply to any HoundShield email and we will remove you manually.",
      503,
    );
  }

  try {
    const { error } = await createServiceClient()
      .from("profiles")
      .update({ marketing_opt_out_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw new Error(error.message);
  } catch (err) {
    console.error("[unsubscribe] failed to record opt-out:", err);
    return page(
      "We could not record that right now",
      "Something went wrong on our side and your request was not saved. Please reply to any HoundShield email and we will remove you manually.",
      503,
    );
  }

  return page(
    "You are unsubscribed",
    "You will not receive further onboarding emails. You will still get messages about your account — receipts, password resets and security notices — which we are required to send.",
  );
}

/** The link a human clicks. */
export async function GET(req: NextRequest) {
  return unsubscribe(req);
}

/** RFC 8058 one-click, invoked by the mail provider rather than the person. */
export async function POST(req: NextRequest) {
  return unsubscribe(req);
}
