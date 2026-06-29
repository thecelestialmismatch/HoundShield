import { createServiceClient } from "@/lib/supabase/client";
import { sendNotification } from "./notifications";
import { createSeedAnchor } from "@/lib/audit/seed-anchor";
import type { ApprovalStatus } from "@/lib/supabase/types";

export interface ApprovalRequest {
  operation_type: string;
  operation_details: Record<string, unknown>;
  requested_by: string;
  risk_assessment?: string;
  justification?: string;
  timeout_hours?: number; // defaults to 24
}

export interface ApprovalResult {
  approval_id: string;
  status: ApprovalStatus;
  approved_by?: string;
  resolved_at?: string;
}

// Operations that always require HITL approval
const GATED_OPERATIONS = new Set([
  "POLICY_UPDATE",
  "POLICY_DELETE",
  "KEY_ROTATION",
  "QUARANTINE_RELEASE",
  "RULE_DEACTIVATION",
  "DATA_EXPORT",
  "DEPLOYMENT",
  "ENCRYPTION_KEY_CHANGE",
]);

/**
 * HITL Approval Gate
 *
 * All destructive or high-impact operations must pass through this gate.
 * The gate creates an approval request, notifies approvers, and blocks
 * execution until a human decision is made.
 *
 * This satisfies EU AI Act Article 14 (Human Oversight) by ensuring
 * that no autonomous action with significant impact proceeds without
 * explicit human authorization.
 *
 * Flow:
 *   1. Caller requests approval for an operation.
 *   2. Gate creates a pending approval record.
 *   3. Notifications are sent to compliance officers.
 *   4. The operation is blocked until approved/rejected/expired.
 *   5. Every decision is logged with a cryptographic seed anchor.
 */

/**
 * Requests HITL approval for an operation.
 * Returns the approval record ID. The caller must then poll or
 * await the result before proceeding.
 */
export async function requestApproval(
  request: ApprovalRequest
): Promise<string> {
  if (!GATED_OPERATIONS.has(request.operation_type)) {
    throw new Error(
      `Operation "${request.operation_type}" is not a gated operation. ` +
        `Gated operations: ${[...GATED_OPERATIONS].join(", ")}`
    );
  }

  const supabase = createServiceClient();
  const timeoutHours = request.timeout_hours ?? 24;

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + timeoutHours);

  const { data, error } = await supabase
    .from("hitl_approvals")
    .insert({
      operation_type: request.operation_type,
      operation_details: request.operation_details,
      requested_by: request.requested_by,
      status: "PENDING",
      expires_at: expiresAt.toISOString(),
      risk_assessment: request.risk_assessment ?? null,
      justification: request.justification ?? null,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create approval request: ${error.message}`);
  }

  // Send notification
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await sendNotification({
    title: `Approval Required: ${request.operation_type}`,
    message:
      `Requested by: ${request.requested_by}\n` +
      `Justification: ${request.justification ?? "None provided"}\n` +
      `Expires: ${expiresAt.toISOString()}`,
    severity:
      request.risk_assessment === "HIGH" || request.risk_assessment === "CRITICAL"
        ? "critical"
        : "warning",
    action_url: `${appUrl}/dashboard?approval=${data.id}`,
  });

  return data.id;
}

/**
 * Resolves an approval request (approve or reject).
 * Creates a cryptographic seed anchor for the decision.
 */
export async function resolveApproval(
  approvalId: string,
  decision: "APPROVED" | "REJECTED",
  approvedBy: string
): Promise<void> {
  const supabase = createServiceClient();

  // Check current status
  const { data: existing, error: fetchError } = await supabase
    .from("hitl_approvals")
    .select("*")
    .eq("id", approvalId)
    .single();

  if (fetchError || !existing) {
    throw new Error(`Approval ${approvalId} not found`);
  }

  if (existing.status !== "PENDING") {
    throw new Error(
      `Approval ${approvalId} is already ${existing.status}`
    );
  }

  // Check expiration
  if (new Date(existing.expires_at) < new Date()) {
    await supabase
      .from("hitl_approvals")
      .update({ status: "EXPIRED", resolved_at: new Date().toISOString() })
      .eq("id", approvalId);
    throw new Error(`Approval ${approvalId} has expired`);
  }

  // Update the approval
  const { error: updateError } = await supabase
    .from("hitl_approvals")
    .update({
      status: decision,
      approved_by: approvedBy,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", approvalId);

  if (updateError) {
    throw new Error(`Failed to resolve approval: ${updateError.message}`);
  }

  // Anchor the decision with a cryptographic seed
  await createSeedAnchor({
    entity_type: "HITL",
    entity_id: approvalId,
    content: {
      operation_type: existing.operation_type,
      decision,
      approved_by: approvedBy,
      requested_by: existing.requested_by,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Checks the status of an approval request.
 */
export async function checkApprovalStatus(
  approvalId: string
): Promise<ApprovalResult> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("hitl_approvals")
    .select("*")
    .eq("id", approvalId)
    .single();

  if (error || !data) {
    throw new Error(`Approval ${approvalId} not found`);
  }

  // Auto-expire if past deadline
  if (data.status === "PENDING" && new Date(data.expires_at) < new Date()) {
    await supabase
      .from("hitl_approvals")
      .update({ status: "EXPIRED", resolved_at: new Date().toISOString() })
      .eq("id", approvalId);

    return {
      approval_id: approvalId,
      status: "EXPIRED",
    };
  }

  return {
    approval_id: approvalId,
    status: data.status,
    approved_by: data.approved_by ?? undefined,
    resolved_at: data.resolved_at ?? undefined,
  };
}

/**
 * Fetches all pending approvals for the dashboard.
 */
export async function getPendingApprovals() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("hitl_approvals")
    .select("*")
    .eq("status", "PENDING")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch pending approvals: ${error.message}`);
  }

  return data ?? [];
}
