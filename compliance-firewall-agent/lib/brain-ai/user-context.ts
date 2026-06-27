/**
 * Brain AI user-awareness. Turns a signed-in user's profile into a short
 * personalization block appended to the system prompt, so Brain addresses them
 * by name and tailors depth to their role/plan. Anonymous visitors (the public
 * widget) produce an empty string — no personalization, unchanged behavior.
 *
 * IMPORTANT: the profile must be derived from the Supabase SESSION server-side
 * (never a client-sent id) — see app/api/chat/route.ts.
 */
export interface BrainUserContext {
  name?: string | null;
  company?: string | null;
  role?: string | null;
  tier?: string | null;
}

const ROLE_LABEL: Record<string, string> = {
  admin: "an administrator",
  compliance_manager: "a compliance manager",
  assessor: "an assessor",
  consultant: "a consultant",
  user: "a team member",
  viewer: "a team member",
};

function firstName(name?: string | null): string {
  return (name ?? "").trim().split(/\s+/)[0] ?? "";
}

/** Builds the personalization sentence, or "" when nothing useful is known. */
export function buildUserContextPrompt(ctx: BrainUserContext | null | undefined): string {
  if (!ctx) return "";
  const name = firstName(ctx.name);
  const company = (ctx.company ?? "").trim();
  const roleLabel = ctx.role ? ROLE_LABEL[ctx.role.trim()] : undefined;
  const tier = (ctx.tier ?? "").trim().toLowerCase();

  // Nothing identifying → no personalization.
  if (!name && !company && !roleLabel) return "";

  let who = "You are speaking with ";
  who += name || "a signed-in customer";
  if (roleLabel) who += `, ${roleLabel}`;
  if (company) who += ` at ${company}`;
  who += ".";

  let guidance =
    " Address them by their first name when it feels natural, and tailor the depth to their role.";
  if (tier && tier !== "free") {
    guidance += ` They are on the ${tier} plan — treat them as a paying customer.`;
  }

  return ` ${who}${guidance}`;
}

/**
 * Direct, customer-facing answer to "Who am I?" and similar identity questions.
 * Works with or without an LLM provider configured, so the public widget can
 * still respond gracefully. Plain prose, no markdown, always ends on a next step.
 */
export function buildIdentityAnswer(ctx: BrainUserContext | null | undefined): string {
  const name = firstName(ctx?.name);
  const company = (ctx?.company ?? "").trim();
  const roleLabel = ctx?.role ? ROLE_LABEL[ctx.role.trim()] : undefined;
  const tier = (ctx?.tier ?? "").trim().toLowerCase();

  if (!name && !company && !roleLabel) {
    return (
      "You're browsing as a guest right now, so I don't have your account details in front of me. " +
      "Sign in and I'll greet you by name, keep your SPRS posture and open CMMC controls at hand, " +
      "and tailor every answer to your environment. You can start free from the Start free button — " +
      "no credit card required."
    );
  }

  let s = "You're ";
  s += name || "signed in";
  if (roleLabel) s += `, ${roleLabel}`;
  if (company) s += ` at ${company}`;
  s += ".";
  if (tier && tier !== "free") {
    s +=
      ` You're on the ${tier} plan, so you have the full CMMC assessment, AI gateway, ` +
      "and C3PAO-ready reporting available.";
  } else if (tier === "free") {
    s +=
      " You're on the free plan, which covers the CMMC self-assessment and your SPRS score.";
  }
  s +=
    " Ask me about your SPRS posture, a specific NIST 800-171 control, or your next step toward " +
    "CMMC Level 2 and I'll take it from there.";
  return s;
}

/**
 * Identity questions ("who am I", "what's my name/company/plan", "do you know
 * who I am") get a direct, session-aware answer — no LLM key required. This is
 * what lets the widget respond sensibly instead of dumping a canned FAQ.
 */
export function isIdentityQuestion(text: string): boolean {
  const t = (text ?? "").toLowerCase();
  return (
    /\bwho\s+am\s+i\b/.test(t) ||
    /\bwhat(?:'?s| is)\s+my\s+(?:name|account|company|plan|tier|role|sprs)\b/.test(t) ||
    /\bdo\s+you\s+know\s+who\s+i\s+am\b/.test(t) ||
    /\bwhat\s+do\s+you\s+know\s+about\s+me\b/.test(t) ||
    /\bam\s+i\s+(?:signed|logged)\s+in\b/.test(t)
  );
}
