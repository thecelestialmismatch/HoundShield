/**
 * Brain AI — Dialog Launchers
 *
 * Pre-built dialog flows for common Brain AI interactions.
 * Each launcher defines a structured conversation starter.
 * Brain AI original implementation for Hound Shield.
 */

export interface DialogLauncher {
  id: string;
  name: string;
  description: string;
  triggerPhrases: string[];
  initialPrompt: string;
  suggestedFollowUps: string[];
  skill?: string;
  requiresAuth: boolean;
}

export const DEFAULT_DIALOGS: DialogLauncher[] = [
  {
    id: "cmmc-summary",
    name: "CMMC Compliance Summary",
    description: "Get a quick summary of your CMMC Level 2 compliance status",
    triggerPhrases: ["cmmc summary", "compliance status", "how am i doing", "sprs score"],
    initialPrompt:
      "Give me a concise CMMC Level 2 compliance summary. Explain what Level 2 requires, the key domains, and what actions a defense contractor should take first.",
    suggestedFollowUps: [
      "What are the most critical gaps to fix first?",
      "How do I calculate my SPRS score?",
      "What does a C3PAO assessment involve?",
    ],
    skill: "cmmc-assessor",
    requiresAuth: false,
  },
  {
    id: "parity-audit",
    name: "System Parity Audit",
    description: "Check Brain AI feature coverage and identify any gaps",
    triggerPhrases: ["parity audit", "feature coverage", "what's missing", "system check"],
    initialPrompt:
      "Run a Brain AI parity audit. Check all modules, API routes, tools, and compliance features. Report coverage percentages and highlight anything missing.",
    suggestedFollowUps: [
      "Show me the full audit report",
      "Which features have the lowest coverage?",
      "What should we build next?",
    ],
    requiresAuth: false,
  },
  {
    id: "cui-detection",
    name: "CUI Detection Demo",
    description: "Demonstrate CUI and sensitive data detection capabilities",
    triggerPhrases: ["detect cui", "scan for cui", "what can you find", "demo detection"],
    initialPrompt:
      "Demonstrate Brain AI's CUI and sensitive data detection. Explain all 16+ pattern types you can detect, give examples of each, and explain what happens when each is found.",
    suggestedFollowUps: [
      "Can you scan a sample contract?",
      "What's the difference between CUI and PII?",
      "How do you handle ITAR-controlled data?",
    ],
    skill: "cui-detector",
    requiresAuth: false,
  },
  {
    id: "gap-analysis",
    name: "Compliance Gap Analysis",
    description: "Identify and prioritize your compliance gaps",
    triggerPhrases: ["gap analysis", "compliance gaps", "what do I need to fix", "remediation plan"],
    initialPrompt:
      "Help me identify my CMMC Level 2 compliance gaps. Ask me about my current security controls and identify what I'm missing. Prioritize by SPRS impact.",
    suggestedFollowUps: [
      "How long will it take to close these gaps?",
      "What tools can help with remediation?",
      "Generate a POA&M template",
    ],
    skill: "gap-analyzer",
    requiresAuth: true,
  },
  {
    id: "onboarding",
    name: "CMMC Onboarding",
    description: "Get started with CMMC compliance from scratch",
    triggerPhrases: ["get started", "new to cmmc", "onboard me", "where do I begin"],
    initialPrompt:
      "I want to get started with CMMC compliance. I'm a defense contractor and need to understand what I need to do. Guide me through the basics.",
    suggestedFollowUps: [
      "What's the difference between CMMC Level 1 and Level 2?",
      "Do I need a C3PAO assessment?",
      "How much does CMMC compliance cost?",
    ],
    skill: "onboarding-guide",
    requiresAuth: false,
  },
];

export function getDialogLauncher(id: string): DialogLauncher | undefined {
  return DEFAULT_DIALOGS.find((d) => d.id === id);
}

export function findDialogByTrigger(text: string): DialogLauncher | undefined {
  const lower = text.toLowerCase();
  return DEFAULT_DIALOGS.find((d) =>
    d.triggerPhrases.some((phrase) => lower.includes(phrase))
  );
}

export function getAllDialogs(): DialogLauncher[] {
  return DEFAULT_DIALOGS;
}

export function getDialogsBySkill(skill: string): DialogLauncher[] {
  return DEFAULT_DIALOGS.filter((d) => d.skill === skill);
}
