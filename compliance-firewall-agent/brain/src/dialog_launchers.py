from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class DialogLauncher:
    id: str
    name: str
    description: str
    trigger_phrases: list[str]
    initial_prompt: str
    suggested_follow_ups: list[str]
    requires_auth: bool
    skill: str | None = None


DEFAULT_DIALOGS: list[DialogLauncher] = [
    DialogLauncher(
        id="cmmc-summary",
        name="CMMC Compliance Summary",
        description="Get a quick summary of your CMMC Level 2 compliance status",
        trigger_phrases=["cmmc summary", "compliance status", "how am i doing", "sprs score"],
        initial_prompt=(
            "Give me a concise CMMC Level 2 compliance summary. Explain what Level 2 requires, "
            "the key domains, and what actions a defense contractor should take first."
        ),
        suggested_follow_ups=[
            "What are the most critical gaps to fix first?",
            "How do I calculate my SPRS score?",
            "What does a C3PAO assessment involve?",
        ],
        skill="cmmc-assessor",
        requires_auth=False,
    ),
    DialogLauncher(
        id="parity-audit",
        name="System Parity Audit",
        description="Check Brain AI feature coverage and identify any gaps",
        trigger_phrases=["parity audit", "feature coverage", "what's missing", "system check"],
        initial_prompt=(
            "Run a Brain AI parity audit. Check all modules, API routes, tools, and compliance "
            "features. Report coverage percentages and highlight anything missing."
        ),
        suggested_follow_ups=[
            "Show me the full audit report",
            "Which features have the lowest coverage?",
            "What should we build next?",
        ],
        requires_auth=False,
    ),
    DialogLauncher(
        id="cui-detection",
        name="CUI Detection Demo",
        description="Demonstrate CUI and sensitive data detection capabilities",
        trigger_phrases=["detect cui", "scan for cui", "what can you find", "demo detection"],
        initial_prompt=(
            "Demonstrate Brain AI's CUI and sensitive data detection. Explain all 16+ pattern "
            "types you can detect, give examples of each, and explain what happens when each is found."
        ),
        suggested_follow_ups=[
            "Can you scan a sample contract?",
            "What's the difference between CUI and PII?",
            "How do you handle ITAR-controlled data?",
        ],
        skill="cui-detector",
        requires_auth=False,
    ),
    DialogLauncher(
        id="gap-analysis",
        name="Compliance Gap Analysis",
        description="Identify and prioritize your compliance gaps",
        trigger_phrases=["gap analysis", "compliance gaps", "what do I need to fix", "remediation plan"],
        initial_prompt=(
            "Help me identify my CMMC Level 2 compliance gaps. Ask me about my current security "
            "controls and identify what I'm missing. Prioritize by SPRS impact."
        ),
        suggested_follow_ups=[
            "How long will it take to close these gaps?",
            "What tools can help with remediation?",
            "Generate a POA&M template",
        ],
        skill="gap-analyzer",
        requires_auth=True,
    ),
    DialogLauncher(
        id="onboarding",
        name="CMMC Onboarding",
        description="Get started with CMMC compliance from scratch",
        trigger_phrases=["get started", "new to cmmc", "onboard me", "where do I begin"],
        initial_prompt=(
            "I want to get started with CMMC compliance. I'm a defense contractor and need to "
            "understand what I need to do. Guide me through the basics."
        ),
        suggested_follow_ups=[
            "What's the difference between CMMC Level 1 and Level 2?",
            "Do I need a C3PAO assessment?",
            "How much does CMMC compliance cost?",
        ],
        skill="onboarding-guide",
        requires_auth=False,
    ),
]


def get_dialog_launcher(id_: str) -> DialogLauncher | None:
    return next((d for d in DEFAULT_DIALOGS if d.id == id_), None)


def find_dialog_by_trigger(text: str) -> DialogLauncher | None:
    lower = text.lower()
    return next((d for d in DEFAULT_DIALOGS if any(phrase in lower for phrase in d.trigger_phrases)), None)


def get_all_dialogs() -> list[DialogLauncher]:
    return DEFAULT_DIALOGS


def get_dialogs_by_skill(skill: str) -> list[DialogLauncher]:
    return [d for d in DEFAULT_DIALOGS if d.skill == skill]
