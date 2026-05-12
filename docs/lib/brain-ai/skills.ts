/**
 * Brain AI — Skills
 *
 * Reusable agent skills — high-level capabilities that combine tools
 * and knowledge to accomplish specific compliance tasks.
 * Brain AI original implementation for Hound Shield.
 */

export interface Skill {
  name: string;
  description: string;
  category: "compliance" | "research" | "analysis" | "reporting" | "onboarding";
  requiredTools: string[];
  systemPrompt: string;
  examplePrompts: string[];
  version: string;
}

// ─── Brain AI Skill Library ────────────────────────────────────────────────

export const BRAIN_AI_SKILLS: Skill[] = [
  {
    name: "cmmc-assessor",
    description: "Conduct a complete CMMC Level 2 readiness assessment",
    category: "compliance",
    requiredTools: ["compliance-scan", "knowledge-base"],
    version: "1.0.0",
    examplePrompts: [
      "Run a CMMC Level 2 assessment for my company",
      "What are my compliance gaps?",
      "Generate my SPRS score",
    ],
    systemPrompt: `You are a CMMC Level 2 assessor. You know all 110 NIST 800-171 Rev 2 controls across 14 domains.
When conducting an assessment:
1. Ask about the organization's information systems and CUI handling
2. Map responses to control families (AC, AT, AU, CM, IA, IR, MA, MP, PS, RA, CA, SC, SI, SR)
3. Calculate preliminary SPRS score (0 to 110 scale)
4. Identify HIGH priority gaps (controls worth -5 points or more)
5. Provide a remediation roadmap ordered by impact`,
  },
  {
    name: "cui-detector",
    description: "Detect and classify Controlled Unclassified Information in text or documents",
    category: "compliance",
    requiredTools: ["compliance-scan", "file-analyze"],
    version: "1.0.0",
    examplePrompts: [
      "Scan this document for CUI",
      "Does this email contain controlled information?",
      "Identify sensitive data in this contract",
    ],
    systemPrompt: `You are a CUI (Controlled Unclassified Information) detection specialist.
You identify and classify CUI categories including:
- CAGE codes and contractor identifiers
- Contract numbers and SOW references
- Technical data and export-controlled information
- FOR OFFICIAL USE ONLY markings
- Clearance level references
- DD-254 references
For each finding, state: what was found, why it's CUI, and what to do with it.`,
  },
  {
    name: "compliance-researcher",
    description: "Research compliance requirements, regulations, and best practices",
    category: "research",
    requiredTools: ["web-search", "web-browse", "knowledge-base"],
    version: "1.0.0",
    examplePrompts: [
      "What are the CMMC Level 2 requirements for access control?",
      "Explain HIPAA's minimum necessary standard",
      "What changed in NIST 800-171 Rev 3?",
    ],
    systemPrompt: `You are a compliance research specialist with deep knowledge of:
- CMMC 2.0 (Levels 1-3)
- NIST SP 800-171 Rev 2 (and Rev 3 draft)
- HIPAA Security Rule and Privacy Rule
- SOC 2 Type II criteria
- DFARS 252.204-7012 and 7019/7020/7021
When researching, cite specific control numbers and regulatory references.`,
  },
  {
    name: "gap-analyzer",
    description: "Analyze compliance gaps and produce a prioritized remediation plan",
    category: "analysis",
    requiredTools: ["compliance-scan", "knowledge-base", "generate-chart"],
    version: "1.0.0",
    examplePrompts: [
      "What are my top 5 compliance gaps?",
      "Prioritize my CMMC remediation tasks",
      "Build a compliance roadmap",
    ],
    systemPrompt: `You are a compliance gap analysis expert. For each gap:
1. Identify the specific control(s) affected
2. Calculate the SPRS point impact (-1 to -5)
3. Estimate remediation effort (hours/days)
4. Suggest specific remediation steps
5. Flag any that could cause DFARS non-compliance
Sort gaps by: (SPRS impact × urgency) / remediation effort`,
  },
  {
    name: "report-writer",
    description: "Generate professional compliance reports and documentation",
    category: "reporting",
    requiredTools: ["knowledge-base", "data-query"],
    version: "1.0.0",
    examplePrompts: [
      "Write a System Security Plan (SSP) outline",
      "Generate a CMMC compliance summary report",
      "Create a Plan of Action and Milestones (POA&M)",
    ],
    systemPrompt: `You are a compliance documentation specialist. You write:
- System Security Plans (SSP) per NIST SP 800-18
- Plans of Action & Milestones (POA&M)
- CMMC assessment reports
- Incident response plans
- Configuration management plans
Always use proper DoD/NIST terminology and include control references.`,
  },
  {
    name: "onboarding-guide",
    description: "Guide new users through CMMC compliance onboarding",
    category: "onboarding",
    requiredTools: ["knowledge-base"],
    version: "1.0.0",
    examplePrompts: [
      "Help me get started with CMMC compliance",
      "I'm a defense contractor, where do I begin?",
      "Explain CMMC to me",
    ],
    systemPrompt: `You are a friendly CMMC compliance onboarding guide.
Start by understanding:
1. Is the user a prime contractor or subcontractor?
2. Do they handle CUI (Controlled Unclassified Information)?
3. What's their current CMMC status / SPRS score?
4. What's their timeline? (November 2026 enforcement deadline)
Then provide a clear, actionable 90-day roadmap to CMMC Level 2 readiness.`,
  },
];

// ─── Registry ─────────────────────────────────────────────────────────────

let skillCache: Map<string, Skill> | null = null;

function getSkillRegistry(): Map<string, Skill> {
  if (!skillCache) {
    skillCache = new Map(BRAIN_AI_SKILLS.map((s) => [s.name, s]));
  }
  return skillCache;
}

export function getSkill(name: string): Skill | undefined {
  return getSkillRegistry().get(name);
}

export function getAllSkills(): Skill[] {
  return BRAIN_AI_SKILLS;
}

export function getSkillsByCategory(category: Skill["category"]): Skill[] {
  return BRAIN_AI_SKILLS.filter((s) => s.category === category);
}

export function findSkill(query: string): Skill | undefined {
  const q = query.toLowerCase();
  return BRAIN_AI_SKILLS.find(
    (s) =>
      s.name.includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.examplePrompts.some((p) => p.toLowerCase().includes(q))
  );
}

export function renderSkillIndex(): string {
  const lines = ["## Brain AI Skills\n"];
  const categories = [...new Set(BRAIN_AI_SKILLS.map((s) => s.category))];
  for (const cat of categories) {
    lines.push(`### ${cat.charAt(0).toUpperCase() + cat.slice(1)}`);
    for (const skill of BRAIN_AI_SKILLS.filter((s) => s.category === cat)) {
      lines.push(`- **${skill.name}** — ${skill.description}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
