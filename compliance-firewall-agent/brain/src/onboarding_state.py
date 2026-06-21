from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class ProjectOnboardingState:
    has_readme: bool = False
    has_tests: bool = False
    python_first: bool = False
    org_name_set: bool = False
    assessment_started: bool = False
    assessment_completed: bool = False
    gateway_connected: bool = False
    stripe_subscribed: bool = False
    team_invited: bool = False
    first_scan_run: bool = False
    first_report_generated: bool = False
    onboarding_complete_percent: int = 0

    def get(self, field_name: str) -> bool:
        return bool(getattr(self, field_name))


@dataclass
class OnboardingStep:
    id: str
    label: str
    description: str
    required: bool
    action_url: str | None = None
    action_label: str | None = None


ONBOARDING_STEPS: list[OnboardingStep] = [
    OnboardingStep(
        id="org_name_set",
        label="Set organization name",
        description="Tell us your company name for your compliance reports.",
        required=True,
        action_url="/command-center/settings",
        action_label="Go to Settings",
    ),
    OnboardingStep(
        id="assessment_started",
        label="Start CMMC assessment",
        description="Begin your CMMC Level 2 gap assessment — takes ~30 minutes.",
        required=True,
        action_url="/command-center/shield/assessment",
        action_label="Start Assessment",
    ),
    OnboardingStep(
        id="assessment_completed",
        label="Complete CMMC assessment",
        description="Finish all 110 controls to get your SPRS score.",
        required=True,
        action_url="/command-center/shield/assessment",
        action_label="Continue Assessment",
    ),
    OnboardingStep(
        id="gateway_connected",
        label="Connect AI gateway",
        description="Route your AI traffic through Kaelus for real-time compliance scanning.",
        required=False,
        action_url="/docs",
        action_label="View Integration Docs",
    ),
    OnboardingStep(
        id="stripe_subscribed",
        label="Choose a plan",
        description="Upgrade to Pro or higher for gateway access and unlimited reports.",
        required=False,
        action_url="/pricing",
        action_label="View Plans",
    ),
    OnboardingStep(
        id="team_invited",
        label="Invite team members",
        description="Add your security officer or IT team to collaborate.",
        required=False,
        action_url="/command-center/team",
        action_label="Manage Team",
    ),
    OnboardingStep(
        id="first_scan_run",
        label="Run first compliance scan",
        description="Scan a document or AI prompt for CUI and PII.",
        required=False,
        action_url="/command-center/scanner",
        action_label="Open Scanner",
    ),
    OnboardingStep(
        id="first_report_generated",
        label="Generate compliance report",
        description="Download your first PDF compliance report with SPRS score.",
        required=False,
        action_url="/command-center/shield/reports",
        action_label="Generate Report",
    ),
]


def create_default_onboarding_state() -> ProjectOnboardingState:
    return ProjectOnboardingState()


def compute_onboarding_percent(state: ProjectOnboardingState) -> int:
    required_steps = [s for s in ONBOARDING_STEPS if s.required]
    all_steps = ONBOARDING_STEPS
    completed_required = len([s for s in required_steps if state.get(s.id)])
    optional_steps = [s for s in all_steps if not s.required]
    completed_optional = len([s for s in optional_steps if state.get(s.id)])

    required_score = (completed_required / len(required_steps)) * 70 if required_steps else 70
    optional_score = (completed_optional / len(optional_steps)) * 30 if optional_steps else 0

    return round(required_score + optional_score)


def get_next_onboarding_step(state: ProjectOnboardingState) -> OnboardingStep | None:
    return next((s for s in ONBOARDING_STEPS if not state.get(s.id)), None)


def get_pending_steps(state: ProjectOnboardingState) -> list[OnboardingStep]:
    return [s for s in ONBOARDING_STEPS if not state.get(s.id)]


def render_onboarding_checklist(state: ProjectOnboardingState) -> str:
    pct = compute_onboarding_percent(state)
    lines = [f"## Onboarding Progress: {pct}%\n"]
    for step in ONBOARDING_STEPS:
        done = state.get(step.id)
        req = " *(required)*" if step.required else ""
        icon = "✅" if done else "⬜"
        lines.append(f"- {icon} **{step.label}**{req} — {step.description}")
    return "\n".join(lines)
