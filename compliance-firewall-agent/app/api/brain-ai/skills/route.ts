/**
 * Brain AI — Skills Endpoint
 *
 * GET /api/brain-ai/skills              — list all skills
 * GET /api/brain-ai/skills?name=<name>  — get specific skill
 * GET /api/brain-ai/skills?category=<c> — filter by category
 *
 * Gated because the skill index enumerates what Brain AI can be made to do.
 * That is the capability list an attacker would want before deciding what to
 * aim at /execute.
 */

import { NextRequest } from "next/server";
import {
  getAllSkills,
  getSkill,
  getSkillsByCategory,
  renderSkillIndex,
} from "@/lib/brain-ai/skills";
import { guardBrainAi } from "@/lib/brain-ai/route-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { blocked } = await guardBrainAi(req, "read");
  if (blocked) return blocked;

  const name = req.nextUrl.searchParams.get("name");
  const category = req.nextUrl.searchParams.get("category");
  const format = req.nextUrl.searchParams.get("format");

  if (name) {
    const skill = getSkill(name);
    if (!skill) return Response.json({ error: "Skill not found" }, { status: 404 });
    return Response.json(skill);
  }

  if (category) {
    const skills = getSkillsByCategory(
      category as Parameters<typeof getSkillsByCategory>[0]
    );
    return Response.json({ skills, count: skills.length });
  }

  if (format === "markdown") {
    return new Response(renderSkillIndex(), {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }

  const skills = getAllSkills();
  return Response.json({ skills, count: skills.length });
}
