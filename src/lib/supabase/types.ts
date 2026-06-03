// Hand-written until `supabase gen types typescript` can run against the project

export type Plan = "starter" | "growth" | "enterprise";
export type ScopeType = "org" | "project" | "user";
export type Period = "daily" | "weekly" | "monthly";

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      orgs: {
        Row: {
          id: string;
          owner_id: string | null;
          name: string;
          slug: string;
          plan: Plan;
          stripe_customer_id: string | null;
          slack_webhook_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          name: string;
          slug: string;
          plan?: Plan;
          stripe_customer_id?: string | null;
          slack_webhook_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["orgs"]["Insert"]>;
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          org_id: string;
          scope_type: ScopeType;
          scope_id: string;
          limit_usd: number;
          period: Period;
          soft_alert_pct: number;
          hard_block_pct: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          scope_type?: ScopeType;
          scope_id?: string;
          limit_usd: number;
          period?: Period;
          soft_alert_pct?: number;
          hard_block_pct?: number;
        };
        Update: Partial<Database["public"]["Tables"]["budgets"]["Insert"]>;
        Relationships: [];
      };
      usage_events: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          project_id: string;
          model_id: string;
          provider: string;
          input_tokens: number;
          output_tokens: number;
          cost_usd: number;
          blocked: boolean;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id?: string;
          project_id?: string;
          model_id: string;
          provider: string;
          input_tokens?: number;
          output_tokens?: number;
          cost_usd?: number;
          blocked?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["usage_events"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      daily_spend: {
        Row: {
          org_id: string;
          project_id: string;
          user_id: string;
          provider: string;
          day: string;
          cost_usd: number;
          input_tokens: number;
          output_tokens: number;
          request_count: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      sum_usage_since: {
        Args: { p_org_id: string; p_since: string };
        Returns: number;
      };
    };
  };
}

// Row type helpers
export type OrgRow = Database["public"]["Tables"]["orgs"]["Row"];
export type BudgetRow = Database["public"]["Tables"]["budgets"]["Row"];
export type UsageEventRow = Database["public"]["Tables"]["usage_events"]["Row"];
export type DailySpendRow = Database["public"]["Views"]["daily_spend"]["Row"];
