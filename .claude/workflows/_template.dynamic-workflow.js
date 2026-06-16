/**
 * HoundShield — dynamic workflow TEMPLATE (copy me)
 *
 * A dynamic workflow fans work out across many parallel subagents in ONE session,
 * verifies each result, then converges. Use it for work too big for a single pass:
 * codebase-wide audits/migrations, content generation, multi-source research.
 *
 * THIS FILE is a copy-paste starting point. It encodes the canonical, battle-tested
 * shape used by the other workflows in this folder:
 *
 *     discover work  →  pipeline(item → produce → verify)  →  build-gate + fix loop
 *
 * COPY IT:
 *   cp .claude/workflows/_template.dynamic-workflow.js .claude/workflows/my-thing.js
 *   # edit meta.name, the WORK list, the produce/verify prompts, and the gate command.
 *
 * RUN IT (auto mode + the `ultracode` effort setting, or just ask Claude to run it):
 *   Workflow({ scriptPath: ".claude/workflows/my-thing.js", args: { ... } })
 *
 * Docs: https://code.claude.com/docs/en/workflows  ·  see ./README.md
 *
 * Hooks available in the script body:
 *   agent(prompt, {label, phase, schema, model, isolation})  -> subagent (schema => validated object)
 *   parallel([() => ...])     -> run thunks concurrently (BARRIER; nulls on failure -> .filter(Boolean))
 *   pipeline(items, s1, s2..) -> each item flows through all stages independently (NO barrier) — DEFAULT
 *   phase(title) · log(msg) · args (the args you passed) · budget (token target)
 */

export const meta = {
  // ⚠️ meta must be a PURE LITERAL — no variables, calls, or interpolation.
  name: 'template-dynamic-workflow',
  description: 'Template: discover work, produce+verify each item in a pipeline, then build-gate.',
  whenToUse: 'Copy this when a task needs many parallel subagents over a work-list, with per-item verification and a green build at the end.',
  phases: [
    { title: 'Discover', detail: 'find the work-list (one cheap agent, or use args)' },
    { title: 'Produce', detail: 'one subagent per work item (pipeline, no barrier)' },
    { title: 'Verify', detail: 'adversarially verify each produced item as soon as it is ready' },
    { title: 'Build', detail: 'npm run build gate + self-healing fix loop' },
  ],
}

// ── Config (edit these) ──────────────────────────────────────────────────────
const APP = (args && args.app) || 'compliance-firewall-agent'
// Provide the work-list via args, or discover it in the Discover phase below.
let WORK = (args && args.items) || []

// ── Phase 1: Discover the work-list (skip if args.items was provided) ─────────
phase('Discover')
if (!WORK.length) {
  const discovery = await agent(
    `List the concrete units of work for this task as a JSON array of short strings.
     Repo app lives in ${APP}/. Return ONLY the array.`,
    {
      label: 'discover',
      phase: 'Discover',
      schema: {
        type: 'object',
        properties: { items: { type: 'array', items: { type: 'string' } } },
        required: ['items'],
      },
    },
  )
  WORK = (discovery && discovery.items) || []
}
log(`Work items: ${WORK.length}`)
if (!WORK.length) {
  log('Nothing to do — pass args.items = ["..."] or implement the Discover agent. Exiting.')
  return { produced: [], note: 'no work items' }
}

// ── Phases 2+3: Produce then Verify each item — PIPELINE (no barrier) ─────────
// Item A can be verifying while item B is still producing. Wall-clock = slowest chain.
const results = await pipeline(
  WORK,
  // Stage 1 — produce
  (item, _orig, i) =>
    agent(
      `Produce the deliverable for work item #${i + 1}: "${item}".
       Follow the repo's existing patterns and conventions. Make the change real.`,
      { label: `produce:${i + 1}`, phase: 'Produce' },
    ),
  // Stage 2 — adversarially verify the produced item
  (produced, item, i) =>
    agent(
      `Adversarially verify the work for "${item}". Try to find what is wrong, missing,
       fabricated, or off-pattern. Reply with isReal + issues[].
       Produced summary:\n${produced}`,
      {
        label: `verify:${i + 1}`,
        phase: 'Verify',
        schema: {
          type: 'object',
          properties: {
            isReal: { type: 'boolean' },
            issues: { type: 'array', items: { type: 'string' } },
          },
          required: ['isReal'],
        },
      },
    ).then((verdict) => ({ item, produced, verdict })),
)

const confirmed = results.filter(Boolean).filter((r) => r.verdict && r.verdict.isReal)
const rejected = results.filter(Boolean).filter((r) => !(r.verdict && r.verdict.isReal))
log(`Confirmed ${confirmed.length}/${WORK.length}; rejected ${rejected.length}.`)

// ── Phase 4: Build-gate with a self-healing fix loop (keep this at the end) ───
phase('Build')
let green = false
for (let attempt = 1; attempt <= 3 && !green; attempt++) {
  const gate = await agent(
    `Run \`cd ${APP} && npm run build\`. If it fails, fix the cause (don't revert the work)
     and re-run until green. Report the final build status as { green, summary }.`,
    {
      label: `build-gate:${attempt}`,
      phase: 'Build',
      schema: {
        type: 'object',
        properties: { green: { type: 'boolean' }, summary: { type: 'string' } },
        required: ['green'],
      },
    },
  )
  green = !!(gate && gate.green)
  if (!green) log(`Build attempt ${attempt} not green — retrying fix loop.`)
}

return {
  confirmed: confirmed.map((r) => r.item),
  rejected: rejected.map((r) => ({ item: r.item, issues: r.verdict && r.verdict.issues })),
  buildGreen: green,
}
