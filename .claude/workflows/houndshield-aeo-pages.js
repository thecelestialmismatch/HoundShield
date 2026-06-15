/**
 * HoundShield — AEO answer-page generator (dynamic workflow)
 *
 * Fan-out generator that turns a list of buyer questions into new /answers/[slug]
 * entries in app/answers/_answers.ts — answer-first, sourced, FAQPage-ready — then
 * build-gates. This is the engine for the "1 answer page / week" AEO plan: feed it
 * questions, get publish-ready, schema-marked pages that win AI citations.
 *
 * RUN IT (auto mode + ultracode):
 *   Workflow({ scriptPath: ".claude/workflows/houndshield-aeo-pages.js",
 *              args: { questions: ["Is ChatGPT HIPAA compliant?", "CMMC AI policy template"] } })
 */
export const meta = {
  name: 'houndshield-aeo-pages',
  description: 'Generate sourced, schema-marked /answers pages from a list of buyer questions, then build-gate',
  whenToUse: 'Expand AEO coverage — one or many new answer pages from target queries.',
  phases: [
    { title: 'Draft', detail: 'one researched, answer-first page per question (parallel)' },
    { title: 'Verify', detail: 'fact-check + de-hype each draft against sources' },
    { title: 'Build', detail: 'npm run build gate' },
  ],
}

const APP = (args && args.app) || 'compliance-firewall-agent'
const QUESTIONS = (args && args.questions) || []
if (!QUESTIONS.length) {
  log('No questions passed. Provide args.questions = ["..."]. Suggested targets from the AEO kit:')
  log('"Is ChatGPT HIPAA compliant?", "CMMC AI compliance tool", "local AI proxy CMMC", "C3PAO evidence PDF export"')
}

const ANSWER_CONTRACT = `
Each page is a new entry appended to ${APP}/app/answers/_answers.ts (rendered by the existing
app/answers/[slug]/page.tsx). Shape: { slug, metaTitle (<=60 chars), metaDescription (answer-first,
~150 chars), h1 (the question), lede (40-60 word complete answer), sections [{heading, paragraphs?,
ordered?, table?}], faqs [{q,a}] x3-4 }.

RULES: answer-first; real tables for comparisons; ground every claim in DFARS 252.204-7012 /
NIST 800-171 / HIPAA / SOC 2 facts already used elsewhere in the repo; describe competitors only by
their published cloud-vs-local architecture (no invented numbers/quotes/prices); no fabricated stats;
"HoundShield" one word. Slug = kebab-case of the question.`

// Draft -> adversarial fact-check, pipelined so each verifies as soon as its draft lands.
const results = await pipeline(
  QUESTIONS,
  (q, _orig, i) => agent(
    `Draft a HoundShield AEO answer page for the query: "${q}". Research the topic (it must be accurate
for a defense/compliance buyer). Append a new, complete entry to ${APP}/app/answers/_answers.ts.
${ANSWER_CONTRACT}\nReturn JSON {slug, status}.`,
    { label: `draft:${i}`, phase: 'Draft', schema: { type: 'object', additionalProperties: false, required: ['slug', 'status'], properties: { slug: { type: 'string' }, status: { type: 'string' } } } }
  ),
  (draft, q) => draft && agent(
    `Adversarially fact-check the new "${draft.slug}" answer entry in ${APP}/app/answers/_answers.ts for
the query "${q}". Flag and fix: any fabricated statistic, any overstated capability (FedRAMP must be
roadmap), any invented competitor claim, any answer that isn't complete in the first 60 words. Edit the
entry in place to fix. Return JSON {slug, verdict, fixed}.`,
    { label: `verify:${draft.slug}`, phase: 'Verify', schema: { type: 'object', additionalProperties: false, required: ['slug', 'verdict', 'fixed'], properties: { slug: { type: 'string' }, verdict: { type: 'string' }, fixed: { type: 'boolean' } } } }
  )
)

const ok = results.filter(Boolean)
log(`Answer pages drafted + verified: ${ok.length}/${QUESTIONS.length}`)

phase('Build')
const build = await agent(
  `cd ${APP} && npm run build 2>&1 | tail -60\nReturn JSON: ok + exact errors.`,
  { phase: 'Build', schema: { type: 'object', additionalProperties: false, required: ['ok', 'errors'], properties: { ok: { type: 'boolean' }, errors: { type: 'string' } } } }
)

return { generated: ok.map((r) => r && r.slug).filter(Boolean), buildGreen: build.ok, errors: build.ok ? '' : build.errors }
