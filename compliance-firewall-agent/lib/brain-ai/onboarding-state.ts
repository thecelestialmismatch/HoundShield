/**
 * Brain AI — Project Onboarding State
 *
 * Tracks and persists the user's CMMC onboarding progress.
 * Brain AI original implementation for Kaelus.online.
 */

export interface ProjectOnboardingState {
  hasReadme: boolean;
  hasTests: boolean;
  pythonFirst: boolean;
  // Kaelus-specific onboarding fields
  orgNameSet: boolean;
  assessmentStarted: boolean;
  assessmentCompleted: boolean;
  gatewayConnected: boolean;
  stripeSubscribed: boolean;
  teamInvited: boolean;
  firstScanRun: boolean;
  firstReportGenerated: boolean;
  onboardingCompletePercent: number;
}

export interface OnboardingStep {
  id: keyof Omit<ProjectOnboardingState, "onboardingCompletePercent">;
  label: string;
  description: string;
  required: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "orgNameSet",
    label: "Set organization name",
    description: "Tell us your company name for your compliance reports.",
    required: true,
    actionUrl: "/command-center/settings",
    actionLabel: "Go to Settings",
  },
  {
    id: "assessmentStarted",
    label: "Start CMMC assessment",
    description: "Begin your CMMC Level 2 gap assessment — takes ~30 minutes.",
    required: true,
    actionUrl: "/command-center/shield/assessment",
    actionLabel: "Start Assessment",
  },
  {
    id: "assessmentCompleted",
    label: "Complete CMMC assessment",
    description: "Finish all 110 controls to get your SPRS score.",
    required: true,
    actionUrl: "/command-center/shield/assessment",
    actionLabel: "Continue Assessment",
  },
  {
    id: "gatewayConnected",
    label: "Connect AI gateway",
    description: "Route your AI traffic through Kaelus for real-time compliance scanning.",
    required: false,
    actionUrl: "/docs",
    actionLabel: "View Integration Docs",
  },
  {
    id: "stripeSubscribed",
    label: "Choose a plan",
    description: "Upgrade to Pro or higher for gateway access and unlimited reports.",
    required: false,
    actionUrl: "/pricing",
    actionLabel: "View Plans",
  },
  {
    id: "teamInvited",
    label: "Invite team members",
    description: "Add your security officer or IT team to collaborate.",
    required: false,
    actionUrl: "/command-center/team",
    actionLabel: "Manage Team",
  },
  {
    id: "firstScanRun",
    label: "Run first compliance scan",
    description: "Scan a document or AI prompt for CUI and PII.",
    required: false,
    actionUrl: "/command-center/scanner",
    actionLabel: "Open Scanner",
  },
  {
    id: "firstReportGenerated",
    label: "Generate compliance report",
    description: "Download your first PDF compliance report with SPRS score.",
    required: false,
    actionUrl: "/command-center/shield/reports",
    actionLabel: "Generate Report",
  },
];

export function createDefaultOnboardingState(): ProjectOnboardingState {
  return {
    hasReadme: false,
    hasTests: false,
    pythonFirst: false,
    orgNameSet: false,
    assessmentStarted: false,
    assessmentCompleted: false,
    gatewayConnected: false,
    stripeSubscribed: false,
    teamInvited: false,
    firstScanRun: false,
    firstReportGenerated: false,
    onboardingCompletePercent: 0,
  };
}

export function computeOnboardingPercent(state: ProjectOnboardingState): number {
  const requiredSteps = ONBOARDING_STEPS.filter((s) => s.required);
  const allSteps = ONBOARDING_STEPS;
  const completedRequired = requiredSteps.filter(
    (s) => state[s.id as keyof typeof state]
  ).length;
  const completedOptional = allSteps
    .filter((s) => !s.required)
    .filter((s) => state[s.id as keyof typeof state]).length;

  // Required steps = 70% weight, optional = 30%
  const requiredScore = requiredSteps.length > 0
    ? (completedRequired / requiredSteps.length) * 70
    : 70;
  const optionalSteps = allSteps.filter((s) => !s.required);
  const optionalScore = optionalSteps.length > 0
    ? (completedOptional / optionalSteps.length) * 30
    : 0;

  return Math.round(requiredScore + optionalScore);
}

export function getNextOnboardingStep(state: ProjectOnboardingState): OnboardingStep | null {
  return (
    ONBOARDING_STEPS.find((s) => !state[s.id as keyof typeof state]) ?? null
  );
}

export function getPendingSteps(state: ProjectOnboardingState): OnboardingStep[] {
  return ONBOARDING_STEPS.filter((s) => !state[s.id as keyof typeof state]);
}

export function renderOnboardingChecklist(state: ProjectOnboardingState): string {
  const pct = computeOnboardingPercent(state);
  const lines = [`## Onboarding Progress: ${pct}%\n`];
  for (const step of ONBOARDING_STEPS) {
    const done = state[step.id as keyof typeof state];
    const req = step.required ? " *(required)*" : "";
    lines.push(`- ${done ? "✅" : "⬜"} **${step.label}**${req} — ${step.description}`);
  }
  return lines.join("\n");
}
