from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

SkillCategory = Literal["compliance", "research", "analysis", "reporting", "onboarding"]


@dataclass
class Skill:
    name: str
    description: str
    category: SkillCategory
    required_tools: list[str]
    system_prompt: str
    example_prompts: list[str]
    version: str


BRAIN_AI_SKILLS: list[Skill] = [
    Skill(
        name="cmmc-assessor",
        description="Conduct a complete CMMC Level 2 readiness assessment",
        category="compliance",
        required_tools=["compliance-scan", "knowledge-base"],
        version="1.0.0",
        example_prompts=[
            "Run a CMMC Level 2 assessment for my company",
            "What are my compliance gaps?",
            "Generate my SPRS score",
        ],
        system_prompt=(
            "You are a CMMC Level 2 assessor. You know all 110 NIST 800-171 Rev 2 controls across 14 domains.\n"
            "When conducting an assessment:\n"
            "1. Ask about the organization's information systems and CUI handling\n"
            "2. Map responses to control families (AC, AT, AU, CM, IA, IR, MA, MP, PS, RA, CA, SC, SI, SR)\n"
            "3. Calculate preliminary SPRS score (0 to 110 scale)\n"
            "4. Identify HIGH priority gaps (controls worth -5 points or more)\n"
            "5. Provide a remediation roadmap ordered by impact"
        ),
    ),
    Skill(
        name="cui-detector",
        description="Detect and classify Controlled Unclassified Information in text or documents",
        category="compliance",
        required_tools=["compliance-scan", "file-analyze"],
        version="1.0.0",
        example_prompts=[
            "Scan this document for CUI",
            "Does this email contain controlled information?",
            "Identify sensitive data in this contract",
        ],
        system_prompt=(
            "You are a CUI (Controlled Unclassified Information) detection specialist.\n"
            "You identify and classify CUI categories including:\n"
            "- CAGE codes and contractor identifiers\n"
            "- Contract numbers and SOW references\n"
            "- Technical data and export-controlled information\n"
            "- FOR OFFICIAL USE ONLY markings\n"
            "- Clearance level references\n"
            "- DD-254 references\n"
            "For each finding, state: what was found, why it's CUI, and what to do with it."
        ),
    ),
    Skill(
        name="compliance-researcher",
        description="Research compliance requirements, regulations, and best practices",
        category="research",
        required_tools=["web-search", "web-browse", "knowledge-base"],
        version="1.0.0",
        example_prompts=[
            "What are the CMMC Level 2 requirements for access control?",
            "Explain HIPAA's minimum necessary standard",
            "What changed in NIST 800-171 Rev 3?",
        ],
        system_prompt=(
            "You are a compliance research specialist with deep knowledge of:\n"
            "- CMMC 2.0 (Levels 1-3)\n"
            "- NIST SP 800-171 Rev 2 (and Rev 3 draft)\n"
            "- HIPAA Security Rule and Privacy Rule\n"
            "- SOC 2 Type II criteria\n"
            "- DFARS 252.204-7012 and 7019/7020/7021\n"
            "When researching, cite specific control numbers and regulatory references."
        ),
    ),
    Skill(
        name="gap-analyzer",
        description="Analyze compliance gaps and produce a prioritized remediation plan",
        category="analysis",
        required_tools=["compliance-scan", "knowledge-base", "generate-chart"],
        version="1.0.0",
        example_prompts=[
            "What are my top 5 compliance gaps?",
            "Prioritize my CMMC remediation tasks",
            "Build a compliance roadmap",
        ],
        system_prompt=(
            "You are a compliance gap analysis expert. For each gap:\n"
            "1. Identify the specific control(s) affected\n"
            "2. Calculate the SPRS point impact (-1 to -5)\n"
            "3. Estimate remediation effort (hours/days)\n"
            "4. Suggest specific remediation steps\n"
            "5. Flag any that could cause DFARS non-compliance\n"
            "Sort gaps by: (SPRS impact × urgency) / remediation effort"
        ),
    ),
    Skill(
        name="report-writer",
        description="Generate professional compliance reports and documentation",
        category="reporting",
        required_tools=["knowledge-base", "data-query"],
        version="1.0.0",
        example_prompts=[
            "Write a System Security Plan (SSP) outline",
            "Generate a CMMC compliance summary report",
            "Create a Plan of Action and Milestones (POA&M)",
        ],
        system_prompt=(
            "You are a compliance documentation specialist. You write:\n"
            "- System Security Plans (SSP) per NIST SP 800-18\n"
            "- Plans of Action & Milestones (POA&M)\n"
            "- CMMC assessment reports\n"
            "- Incident response plans\n"
            "- Configuration management plans\n"
            "Always use proper DoD/NIST terminology and include control references."
        ),
    ),
    Skill(
        name="onboarding-guide",
        description="Guide new users through CMMC compliance onboarding",
        category="onboarding",
        required_tools=["knowledge-base"],
        version="1.0.0",
        example_prompts=[
            "Help me get started with CMMC compliance",
            "I'm a defense contractor, where do I begin?",
            "Explain CMMC to me",
        ],
        system_prompt=(
            "You are a friendly CMMC compliance onboarding guide.\n"
            "Start by understanding:\n"
            "1. Is the user a prime contractor or subcontractor?\n"
            "2. Do they handle CUI (Controlled Unclassified Information)?\n"
            "3. What's their current CMMC status / SPRS score?\n"
            "4. What's their timeline? (November 2026 enforcement deadline)\n"
            "Then provide a clear, actionable 90-day roadmap to CMMC Level 2 readiness."
        ),
    ),
]

_skill_cache: dict[str, Skill] | None = None


def _get_skill_registry() -> dict[str, Skill]:
    global _skill_cache
    if _skill_cache is None:
        _skill_cache = {s.name: s for s in BRAIN_AI_SKILLS}
    return _skill_cache


def get_skill(name: str) -> Skill | None:
    return _get_skill_registry().get(name)


def get_all_skills() -> list[Skill]:
    return BRAIN_AI_SKILLS


def get_skills_by_category(category: SkillCategory) -> list[Skill]:
    return [s for s in BRAIN_AI_SKILLS if s.category == category]


def find_skill(query: str) -> Skill | None:
    q = query.lower()
    return next(
        (
            s
            for s in BRAIN_AI_SKILLS
            if q in s.name
            or q in s.description.lower()
            or any(q in p.lower() for p in s.example_prompts)
        ),
        None,
    )


def render_skill_index() -> str:
    lines = ["## Brain AI Skills\n"]
    categories: list[str] = []
    for s in BRAIN_AI_SKILLS:
        if s.category not in categories:
            categories.append(s.category)
    for cat in categories:
        lines.append(f"### {cat[0].upper() + cat[1:]}")
        for skill in [s for s in BRAIN_AI_SKILLS if s.category == cat]:
            lines.append(f"- **{skill.name}** — {skill.description}")
        lines.append("")
    return "\n".join(lines)
