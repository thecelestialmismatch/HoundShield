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
