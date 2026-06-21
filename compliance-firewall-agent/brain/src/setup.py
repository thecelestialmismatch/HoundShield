from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Literal

WorkspaceStatus = Literal["ready", "partial", "demo"]


@dataclass
class WorkspaceSetup:
    has_supabase: bool
    has_stripe: bool
    has_open_router: bool
    has_resend: bool
    has_post_hog: bool
    has_sentry: bool
    has_brain_ai_model: bool
    is_demo: bool
    missing_vars: list[str]
    ready_for_production: bool


@dataclass
class SetupReport:
    setup: WorkspaceSetup
    score: int
    status: WorkspaceStatus
    summary: str
    actions: list[str]


def build_workspace_setup() -> WorkspaceSetup:
    env = os.environ

    has_supabase = bool(env.get("NEXT_PUBLIC_SUPABASE_URL") and env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY"))
    has_stripe = bool(env.get("STRIPE_SECRET_KEY") and env.get("STRIPE_WEBHOOK_SECRET"))
    has_open_router = bool(env.get("OPENROUTER_API_KEY"))
    has_resend = bool(env.get("RESEND_API_KEY"))
    has_post_hog = bool(env.get("NEXT_PUBLIC_POSTHOG_KEY"))
    has_sentry = bool(env.get("NEXT_PUBLIC_SENTRY_DSN"))
    has_brain_ai_model = bool(env.get("BRAIN_AI_MODEL"))

    missing_vars: list[str] = []
    if not has_supabase:
        missing_vars.extend(["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"])
    if not has_stripe:
        missing_vars.extend(["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"])
    if not has_open_router:
        missing_vars.append("OPENROUTER_API_KEY")
    if not has_resend:
        missing_vars.append("RESEND_API_KEY")

    is_demo = not has_supabase
    ready_for_production = has_supabase and has_stripe and has_open_router

    return WorkspaceSetup(
        has_supabase=has_supabase,
        has_stripe=has_stripe,
        has_open_router=has_open_router,
        has_resend=has_resend,
        has_post_hog=has_post_hog,
        has_sentry=has_sentry,
        has_brain_ai_model=has_brain_ai_model,
        is_demo=is_demo,
        missing_vars=missing_vars,
        ready_for_production=ready_for_production,
    )


def run_setup() -> SetupReport:
    setup = build_workspace_setup()

    checks = [
        setup.has_supabase,
        setup.has_stripe,
        setup.has_open_router,
        setup.has_resend,
        setup.has_post_hog,
        setup.has_sentry,
    ]
    score = round((len([c for c in checks if c]) / len(checks)) * 100)

    status: WorkspaceStatus = "ready" if setup.ready_for_production else "demo" if setup.is_demo else "partial"

    actions: list[str] = []
    if not setup.has_supabase:
        actions.append("Add NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY to Vercel env vars")
    if not setup.has_stripe:
        actions.append("Add STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET to Vercel env vars")
    if not setup.has_open_router:
        actions.append("Add OPENROUTER_API_KEY — get a free key at openrouter.ai")
    if not setup.has_resend:
        actions.append("Add RESEND_API_KEY for onboarding emails")
    if not setup.has_post_hog:
        actions.append("Add NEXT_PUBLIC_POSTHOG_KEY for analytics (optional)")
    if not setup.has_sentry:
        actions.append("Add NEXT_PUBLIC_SENTRY_DSN for error tracking (optional)")
    if not setup.has_brain_ai_model:
        actions.append("Set BRAIN_AI_MODEL=google/gemini-flash-1.5 (free, recommended default)")

    if status == "ready":
        summary = f"Brain AI workspace is production-ready ({score}% configured)"
    elif status == "demo":
        summary = f"Running in demo mode — {len(setup.missing_vars)} env vars missing"
    else:
        summary = f"Partially configured ({score}%) — {len(actions)} actions needed"

    return SetupReport(setup=setup, score=score, status=status, summary=summary, actions=actions)


def render_setup_report(report: SetupReport) -> str:
    icon = "✅" if report.status == "ready" else "⚠️" if report.status == "partial" else "🟡"
    lines = [
        f"# {icon} Brain AI Setup Report",
        f"**Status:** {report.status.upper()} ({report.score}%)",
        f"**Summary:** {report.summary}",
        "",
        "## Environment Variables",
        f"- Supabase: {'✅' if report.setup.has_supabase else '❌'}",
        f"- Stripe: {'✅' if report.setup.has_stripe else '❌'}",
        f"- OpenRouter: {'✅' if report.setup.has_open_router else '❌'}",
        f"- Resend: {'✅' if report.setup.has_resend else '❌'}",
        f"- PostHog: {'✅' if report.setup.has_post_hog else '❌'}",
        f"- Sentry: {'✅' if report.setup.has_sentry else '❌'}",
        f"- Brain AI Model: {'✅' if report.setup.has_brain_ai_model else '⚠️ (will use default)'}",
    ]

    if report.actions:
        lines.append("")
        lines.append("## Required Actions")
        for i, a in enumerate(report.actions):
            lines.append(f"{i + 1}. {a}")

    return "\n".join(lines)
