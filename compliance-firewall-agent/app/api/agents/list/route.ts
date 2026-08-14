// ============================================================================
// Agents — List API
//
// GET /api/agents/list
//   Returns all 5 built-in HoundShield agents with their configs.
//   Used by the frontend agents page to populate the agent cards.
//
// POST /api/agents/list
//   Classify a task and return the recommended agent + routing decision.
// ============================================================================

import { NextRequest } from 'next/server';
import { BUILTIN_AGENTS } from '@/lib/agent/agents';
import { classifyTask } from '@/lib/agent/agent-router';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Audit finding #5 (residual): `task` was checked for type and emptiness but had
 * no maximum length, so a single request could hand `classifyTask` — and the
 * echoed `suggestedPrompt` it builds — an arbitrarily large string. Generous for
 * a real task description, bounded for a loop.
 */
const MAX_TASK_CHARS = 8_000;

// ---------------------------------------------------------------------------
// GET — list all agents
// ---------------------------------------------------------------------------

export async function GET() {
  return Response.json({
    agents: BUILTIN_AGENTS,
    total: BUILTIN_AGENTS.length,
  });
}

// ---------------------------------------------------------------------------
// POST — classify a task → recommend agent
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { task, agent_id } = body as { task?: string; agent_id?: string };

  if (!task || typeof task !== 'string' || task.trim().length === 0) {
    return Response.json({ error: 'task is required' }, { status: 400 });
  }

  if (task.length > MAX_TASK_CHARS) {
    return Response.json(
      { error: `task exceeds ${MAX_TASK_CHARS} characters` },
      { status: 413 },
    );
  }

  const routing = classifyTask(task.trim(), agent_id);

  return Response.json({
    routing: {
      agentId: routing.agentId,
      agentName: routing.agent.name,
      confidence: routing.confidence,
      reasoning: routing.reasoning,
    },
    agent: routing.agent,
    suggestedPrompt: `You are ${routing.agent.name}. ${routing.agent.description}\n\nTask: ${task}`,
  });
}
