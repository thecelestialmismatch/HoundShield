import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, company, email, clientCount, partnerType, message } = body;

    // Validate required fields
    if (!name || !company || !email) {
      return NextResponse.json(
        { error: "Name, company, and email are required" },
        { status: 400 }
      );
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const validTypes = ["referral", "reseller", "technology"];
    const type = validTypes.includes(partnerType) ? partnerType : "referral";

    const supabase = createServiceClient();

    const { error } = await supabase.from("partner_applications").insert({
      name,
      company,
      email,
      client_count: typeof clientCount === "number" ? clientCount : 0,
      partner_type: type,
      message: message || null,
      status: "pending",
    });

    if (error) {
      console.error("Partner application insert failed:", error);
      return NextResponse.json(
        { error: "Failed to submit application" },
        { status: 500 }
      );
    }

    // Send notification email to founder (non-blocking)
    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "Kaelus Partners <noreply@kaelus.online>",
          to: process.env.FOUNDER_EMAIL || "info@kaelus.online",
          subject: `New Partner Application: ${company}`,
          html: `
            <h2>New Partner Application</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Company:</strong> ${company}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Client Count:</strong> ${clientCount || "Not specified"}</p>
            <p><strong>Partner Type:</strong> ${type}</p>
            <p><strong>Message:</strong> ${message || "None"}</p>
          `,
        });
      }
    } catch (emailErr) {
      // Email failure should never block the application
      console.error("Partner notification email failed:", emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Partner application error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
