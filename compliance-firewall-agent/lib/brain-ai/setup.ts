/**
 * Brain AI — Workspace Setup
 *
 * Detects and validates the Brain AI workspace configuration.
 * Reports what's ready, what's missing, and what needs action.
 * Brain AI original implementation for Kaelus.online.
 */

export interface WorkspaceSetup {
  hasSupabase: boolean;
  hasStripe: boolean;
  hasOpenRouter: boolean;
  hasResend: boolean;
  hasPostHog: boolean;
  hasSentry: boolean;
  hasBrainAIModel: boolean;
  isDemo: boolean;
  missingVars: string[];
  readyForProduction: boolean;
}

export interface SetupReport {
  setup: WorkspaceSetup;
  score: number;         // 0–100
  status: "ready" | "partial" | "demo";
  summary: string;
  actions: string[];
}

export function buildWorkspaceSetup(): WorkspaceSetup {
  const env = process.env;

  const hasSupabase = !!(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasStripe = !!(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);
  const hasOpenRouter = !!env.OPENROUTER_API_KEY;
  const hasResend = !!env.RESEND_API_KEY;
  const hasPostHog = !!env.NEXT_PUBLIC_POSTHOG_KEY;
  const hasSentry = !!env.NEXT_PUBLIC_SENTRY_DSN;
  const hasBrainAIModel = !!env.BRAIN_AI_MODEL;

  const missingVars: string[] = [];
  if (!hasSupabase) missingVars.push("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!hasStripe) missingVars.push("STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET");
  if (!hasOpenRouter) missingVars.push("OPENROUTER_API_KEY");
  if (!hasResend) missingVars.push("RESEND_API_KEY");

  const isDemo = !hasSupabase;
  const readyForProduction = hasSupabase && hasStripe && hasOpenRouter;

  return {
    hasSupabase,
    hasStripe,
    hasOpenRouter,
    hasResend,
    hasPostHog,
    hasSentry,
    hasBrainAIModel,
    isDemo,
    missingVars,
    readyForProduction,
  };
}

export function runSetup(): SetupReport {
  const setup = buildWorkspaceSetup();

  const checks = [
    setup.hasSupabase,
    setup.hasStripe,
    setup.hasOpenRouter,
    setup.hasResend,
    setup.hasPostHog,
    setup.hasSentry,
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  const status = setup.readyForProduction ? "ready" : setup.isDemo ? "demo" : "partial";

  const actions: string[] = [];
  if (!setup.hasSupabase) actions.push("Add NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY to Vercel env vars");
  if (!setup.hasStripe) actions.push("Add STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET to Vercel env vars");
  if (!setup.hasOpenRouter) actions.push("Add OPENROUTER_API_KEY — get a free key at openrouter.ai");
  if (!setup.hasResend) actions.push("Add RESEND_API_KEY for onboarding emails");
  if (!setup.hasPostHog) actions.push("Add NEXT_PUBLIC_POSTHOG_KEY for analytics (optional)");
  if (!setup.hasSentry) actions.push("Add NEXT_PUBLIC_SENTRY_DSN for error tracking (optional)");
  if (!setup.hasBrainAIModel) actions.push("Set BRAIN_AI_MODEL=google/gemini-flash-1.5 (free, recommended default)");

  const summary = status === "ready"
    ? `Brain AI workspace is production-ready (${score}% configured)`
    : status === "demo"
    ? `Running in demo mode — ${setup.missingVars.length} env vars missing`
    : `Partially configured (${score}%) — ${actions.length} actions needed`;

  return { setup, score, status, summary, actions };
}

export function renderSetupReport(report: SetupReport): string {
  const icon = report.status === "ready" ? "✅" : report.status === "partial" ? "⚠️" : "🟡";
  const lines = [
    `# ${icon} Brain AI Setup Report`,
    `**Status:** ${report.status.toUpperCase()} (${report.score}%)`,
    `**Summary:** ${report.summary}`,
    "",
    "## Environment Variables",
    `- Supabase: ${report.setup.hasSupabase ? "✅" : "❌"}`,
    `- Stripe: ${report.setup.hasStripe ? "✅" : "❌"}`,
    `- OpenRouter: ${report.setup.hasOpenRouter ? "✅" : "❌"}`,
    `- Resend: ${report.setup.hasResend ? "✅" : "❌"}`,
    `- PostHog: ${report.setup.hasPostHog ? "✅" : "❌"}`,
    `- Sentry: ${report.setup.hasSentry ? "✅" : "❌"}`,
    `- Brain AI Model: ${report.setup.hasBrainAIModel ? "✅" : "⚠️ (will use default)"}`,
  ];

  if (report.actions.length > 0) {
    lines.push("", "## Required Actions");
    report.actions.forEach((a, i) => lines.push(`${i + 1}. ${a}`));
  }

  return lines.join("\n");
}
