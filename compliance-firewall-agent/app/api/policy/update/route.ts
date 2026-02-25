import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/client";
import {
  requestApproval,
  checkApprovalStatus,
} from "@/lib/hitl/approval-gate";
import { createSeedAnchor } from "@/lib/audit/seed-anchor";
import { z } from "zod";

const PolicyUpdateSchema = z.object({
  rule_id: z.string().uuid(),
  updates: z.object({
    pattern: z.string().optional(),
    risk_level: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    action: z.enum(["ALLOW", "WARN", "BLOCK", "QUARANTINE"]).optional(),
    threshold: z.number().min(0).max(1).optional(),
    is_active: z.boolean().optional(),
  }),
  requested_by: z.string().min(1),
  justification: z.string().min(1),
});

/**
 * POST /api/policy/update
 *
 * Updates a classification rule. This is a HITL-gated operation —
 * the update creates an approval request and does NOT apply the
 * change immediately. A compliance officer must approve it first.
 *
 * This prevents unauthorized weakening of detection rules (e.g.,
 * an attacker disabling PII detection to exfiltrate data).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = PolicyUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { rule_id, updates, requested_by, justification } = parseResult.data;

    // Verify the rule exists
    const supabase = createServiceClient();
    const { data: existingRule, error: fetchError } = await supabase
      .from("policy_rules")
      .select("*")
      .eq("id", rule_id)
      .single();

    if (fetchError || !existingRule) {
      return NextResponse.json(
        { error: `Rule ${rule_id} not found` },
        { status: 404 }
      );
    }

    // Request HITL approval
    const approvalId = await requestApproval({
      operation_type: "POLICY_UPDATE",
      operation_details: {
        rule_id,
        rule_name: existingRule.name,
        current_values: {
          pattern: existingRule.pattern,
          risk_level: existingRule.risk_level,
          action: existingRule.action,
          threshold: existingRule.threshold,
          is_active: existingRule.is_active,
        },
        proposed_changes: updates,
      },
      requested_by,
      risk_assessment:
        updates.is_active === false || updates.action === "ALLOW"
          ? "HIGH"
          : "MEDIUM",
      justification,
    });

    return NextResponse.json({
      message: "Policy update requires approval",
      approval_id: approvalId,
      status: "PENDING",
    });
  } catch (err) {
    console.error("Policy update error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/policy/update?approval_id=xxx
 *
 * Checks the status of a policy update approval.
 * If approved, applies the update and anchors it with a seed.
 */
export async function GET(req: NextRequest) {
  try {
    const approvalId = req.nextUrl.searchParams.get("approval_id");
    if (!approvalId) {
      return NextResponse.json(
        { error: "approval_id query param required" },
        { status: 400 }
      );
    }

    const result = await checkApprovalStatus(approvalId);

    // If approved, apply the changes now
    if (result.status === "APPROVED") {
      const supabase = createServiceClient();

      const { data: approval } = await supabase
        .from("hitl_approvals")
        .select("operation_details")
        .eq("id", approvalId)
        .single();

      if (approval) {
        const details = approval.operation_details as {
          rule_id: string;
          proposed_changes: Record<string, unknown>;
        };

        const updatePayload = {
          ...details.proposed_changes,
          updated_at: new Date().toISOString(),
        };

        await supabase
          .from("policy_rules")
          .update(updatePayload)
          .eq("id", details.rule_id);

        // Anchor the policy change
        await createSeedAnchor({
          entity_type: "POLICY",
          entity_id: details.rule_id,
          content: {
            operation: "UPDATE",
            changes: details.proposed_changes,
            approved_by: result.approved_by,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Approval check error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
