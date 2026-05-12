// Generated types matching the Supabase schema

export type RiskLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ActionTaken = "ALLOWED" | "BLOCKED" | "QUARANTINED";
export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
export type RuleCategory = "PII" | "FINANCIAL" | "STRATEGIC" | "IP" | "HIPAA_PHI";
export type PatternType = "REGEX" | "KEYWORD" | "SEMANTIC";
export type RuleAction = "ALLOW" | "WARN" | "BLOCK" | "QUARANTINE";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

export interface ComplianceEvent {
  id: string;
  created_at: string;
  user_id: string;
  prompt_hash: string;
  destination_provider: string | null;
  risk_level: RiskLevel;
  classifications: string[];
  action_taken: ActionTaken;
  confidence_score: number;
  detected_entities: DetectedEntity[];
  seed_hash: string | null;
  processing_time_ms: number | null;
  metadata: Record<string, unknown>;
}

export interface QuarantineItem {
  id: string;
  created_at: string;
  event_id: string;
  prompt_content_encrypted: string;
  encryption_iv: string;
  detected_entities: DetectedEntity[];
  review_status: ReviewStatus;
  reviewer_id: string | null;
  reviewed_at: string | null;
  resolution_notes: string | null;
  priority: number;
}

export interface PolicyRule {
  id: string;
  created_at: string;
  updated_at: string;
  category: RuleCategory;
  name: string;
  description: string | null;
  pattern: string;
  pattern_type: PatternType;
  risk_level: RiskLevel;
  threshold: number;
  action: RuleAction;
  is_active: boolean;
  seed_hash: string | null;
}

export interface AuditReport {
  id: string;
  created_at: string;
  period_start: string;
  period_end: string;
  total_events: number;
  total_violations: number;
  events_by_risk: Record<string, number>;
  events_by_category: Record<string, number>;
  events_by_action: Record<string, number>;
  report_data: Record<string, unknown>;
  seed_hash: string | null;
}

export interface HITLApproval {
  id: string;
  created_at: string;
  operation_type: string;
  operation_details: Record<string, unknown>;
  requested_by: string;
  approved_by: string | null;
  status: ApprovalStatus;
  resolved_at: string | null;
  expires_at: string;
  risk_assessment: string | null;
  justification: string | null;
}

export interface SeedAnchor {
  id: string;
  created_at: string;
  entity_type: string;
  entity_id: string;
  content_hash: string;
  previous_hash: string | null;
  merkle_root: string | null;
  verification_status: string;
}

export interface DetectedEntity {
  type: RuleCategory;
  value_redacted: string;
  pattern_matched: string;
  confidence: number;
  position: { start: number; end: number };
}

export interface ClassificationResult {
  risk_level: RiskLevel;
  classifications: RuleCategory[];
  entities: DetectedEntity[];
  confidence: number;
  should_block: boolean;
  should_quarantine: boolean;
  matched_rules: string[];
}

export interface InterceptedRequest {
  prompt: string;
  user_id: string;
  destination: string;
  timestamp: string;
  request_id: string;
  headers?: Record<string, string>;
}

// ── Profiles & Subscriptions (Migration 003) ──

export type UserRole = "user" | "admin" | "consultant";
export type SubscriptionTier = "free" | "pro" | "enterprise" | "agency";
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "trialing" | "paused" | "incomplete";

export interface Profile {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  company: string | null;
  role: UserRole;
  tier: SubscriptionTier;
  stripe_customer_id: string | null;
  onboarding_completed: boolean;
  metadata: Record<string, unknown>;
}

export interface Subscription {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  metadata: Record<string, unknown>;
}

export interface UsageTracking {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  api_scans: number;
  ai_agent_runs: number;
  documents_generated: number;
  assessments_started: number;
  metadata: Record<string, unknown>;
}

// ── Tier Limits ──

export const TIER_LIMITS: Record<SubscriptionTier, {
  api_scans: number;
  ai_agents: number;
  documents: number;
  assessments: number;
  price_monthly: number;
}> = {
  free:       { api_scans: 100,       ai_agents: 1,  documents: 0,  assessments: 1, price_monthly: 0 },
  pro:        { api_scans: Infinity,  ai_agents: 5,  documents: 20, assessments: 5, price_monthly: 49 },
  enterprise: { api_scans: Infinity,  ai_agents: -1, documents: -1, assessments: -1, price_monthly: 199 },
  agency:     { api_scans: Infinity,  ai_agents: -1, documents: -1, assessments: -1, price_monthly: 499 },
};
