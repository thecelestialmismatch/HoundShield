/**
 * HoundShield — Direction-A production port (dynamic workflow)
 *
 * Re-runnable orchestration that builds the industry product pages + AEO answer
 * pages, wires the NavV3 mega-menu and sitemap, then build-gates to green with a
 * self-healing fix loop. Authored for Claude Code dynamic workflows (`ultracode`).
 *
 * RUN IT:  open Claude Code in the repo (Max/Team/Enterprise, or Pro with
 *          workflows enabled in /config), turn on auto mode + `ultracode`, then:
 *            "Run the .claude/workflows/houndshield-port.js workflow."
 *          or ask Claude: Workflow({ scriptPath: ".claude/workflows/houndshield-port.js" })
 *
 * NOTE: workflow SUBAGENTS need write permission. In a sandbox where Write/Edit
 * are blocked for subagents, run this in your own authenticated Claude Code (auto
 * mode) where the agents can write — otherwise they burn turns on permission walls.
 */
export const meta = {
  name: 'houndshield-direction-a-port',
  description: 'Build industry product pages + AEO answer pages, wire NavV3 + sitemap, build-gate to green',
  whenToUse: 'Re-port or extend the Direction-A marketing surface (products + answers) into the Next.js app.',
  phases: [
    { title: 'Pages', detail: 'product pages + answer pages, parallel, distinct new files' },
    { title: 'Wire', detail: 'NavV3 industry hrefs + sitemap.ts routes' },
    { title: 'Build', detail: 'npm run build gate' },
    { title: 'Fix', detail: 'repair build errors until green (<=3 rounds)' },
  ],
}

// App root is resolved relative to wherever Claude Code is launched (repo root).
const APP = (args && args.app) || 'compliance-firewall-agent'

const CONTRACT = `
SHELL CONTRACT: Next.js 15 App Router SERVER component (no "use client"). Mirror
${APP}/app/privacy/page.tsx (NavV3 + export const metadata) and ${APP}/app/products/[industry]/page.tsx
(the canonical product-page pattern already in the repo). Import { NavV3 } from
"@/components/layout/NavV3" and { FooterV3 } from "@/components/layout/FooterV3".
Wrap in <div className="min-h-screen bg-[var(--hs-surface-0)] text-[var(--hs-ink)]">.

DESIGN TOKENS (light-steel only — NEVER amber/yellow/indigo/blue/purple/emerald):
text var(--hs-ink|--hs-ink-secondary|--hs-ink-tertiary); surfaces var(--hs-surface-0|1|2);
accent var(--hs-steel|--hs-steel-dark); borders var(--hs-border); semantic
var(--hs-success|--hs-danger|--hs-warn); fonts var(--font-display|--font-body|--font-mono).

AEO: question-form H1; 40-60 word answer-first lede in .answer-lead; real <table>/<ol>;
6-8 <details> FAQ; FAQPage + Speakable JSON-LD via <script type="application/ld+json"
dangerouslySetInnerHTML={{__html: JSON.stringify(obj)}} />.

GUARDRAILS: no fabricated stats (attribute IBM/Anthem/C3PAO figures); FedRAMP = roadmap;
"HoundShield" one word; component < 500 lines. RETURN: file path + one-line status.`

phase('Pages')

// Drive page topics from the repo's own data files so the workflow stays in sync.
const PRODUCT_SLUGS = (args && args.products) || [
  'technology', 'healthcare', 'defense', 'legal', 'global', 'government',
]
const ANSWER_SLUGS = (args && args.answers) || [
  'can-defense-contractors-use-chatgpt', 'dfars-7012-ai-tools', 'houndshield-vs-nightfall-cmmc',
]

const pageSchema = {
  type: 'object', additionalProperties: false, required: ['file', 'status'],
  properties: { file: { type: 'string' }, status: { type: 'string' } },
}

const productThunks = PRODUCT_SLUGS.map((slug) => () =>
  agent(
    `Ensure ${APP}/app/products/${slug}/page.tsx renders correctly from ${APP}/app/products/_industries.ts.
The dynamic route ${APP}/app/products/[industry]/page.tsx already renders all industries from that data file;
your job is to (a) verify the "${slug}" entry in _industries.ts is complete and accurate against
HERMES-REDESIGN/houndshield-demo.html (data-view="prod-${slug}"), and (b) fix any gaps. ${CONTRACT}`,
    { label: `product:${slug}`, phase: 'Pages', schema: pageSchema }
  )
)

const answerThunks = ANSWER_SLUGS.map((slug) => () =>
  agent(
    `Ensure the "${slug}" entry in ${APP}/app/answers/_answers.ts is complete, answer-first, and accurate.
The dynamic route ${APP}/app/answers/[slug]/page.tsx renders it. Source: HERMES-REDESIGN/AEO/. ${CONTRACT}`,
    { label: `answer:${slug}`, phase: 'Pages', schema: pageSchema }
  )
)

const built = (await parallel([...productThunks, ...answerThunks])).filter(Boolean)
log(`Pages verified: ${built.length}/${PRODUCT_SLUGS.length + ANSWER_SLUGS.length}`)

phase('Wire')
await agent(
  `Verify ${APP}/components/layout/NavV3.tsx INDUSTRIES hrefs all point to /products/<slug>, and that
${APP}/app/sitemap.ts includes every /products/* and /answers/* route (it imports INDUSTRY_SLUGS and
ANSWER_SLUGS). Fix any drift. Return a summary.`,
  { phase: 'Wire' }
)

phase('Build')
let build = await agent(
  `cd ${APP} && npm run build 2>&1 | tail -80
Return JSON: ok=true only if the build completed with no errors (warnings OK); else exact error lines in "errors".`,
  { phase: 'Build', schema: { type: 'object', additionalProperties: false, required: ['ok', 'errors'], properties: { ok: { type: 'boolean' }, errors: { type: 'string' } } } }
)

let round = 0
while (!build.ok && round < 3) {
  round++
  phase('Fix')
  log(`Build red (round ${round}) — dispatching fix agent`)
  await agent(
    `The HoundShield build is failing. Fix the root cause without weakening types or adding "use client"
unless genuinely required. Keep the server-component + light-steel contract.\n\nERRORS:\n${build.errors}\n\nApp root: ${APP}.`,
    { phase: 'Fix' }
  )
  build = await agent(
    `cd ${APP} && npm run build 2>&1 | tail -80\nReturn JSON: ok + exact remaining errors.`,
    { label: `rebuild:${round}`, phase: 'Build', schema: { type: 'object', additionalProperties: false, required: ['ok', 'errors'], properties: { ok: { type: 'boolean' }, errors: { type: 'string' } } } }
  )
}

return { pagesVerified: built.length, buildGreen: build.ok, fixRounds: round, remainingErrors: build.ok ? '' : build.errors }
