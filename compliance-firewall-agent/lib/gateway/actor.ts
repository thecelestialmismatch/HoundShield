/**
 * Who — or what — sent this prompt.
 *
 * ── The problem this exists for ──────────────────────────────────────────────
 * Every AI DLP product on the market, ours included until now, was built around
 * a human pasting something they should not have. That model is going away. An
 * engineer sends maybe twenty prompts a day; an autonomous coding agent sends
 * hundreds per task, unattended, at machine speed, and it keeps going while
 * nobody is watching.
 *
 * For a regulated customer that is not just more volume, it is a different
 * control problem. NIST 800-171 3.1.1 and 3.1.2 limit system access to
 * authorized USERS and to the transactions those users are permitted to
 * execute, and AU.2.041 requires actions to be traceable to individual users so
 * they can be held accountable. An agent run is a stream of transactions with
 * no individual attached to any single one. Asked "who sent this CUI to
 * OpenAI?", the honest answer today is "a process".
 *
 * HoundShield is already in the path — every one of these tools speaks the
 * OpenAI-compatible protocol our gateway serves, so agent traffic arrives with
 * no integration work at all. What was missing is that we threw away the one
 * thing on the request that says what produced it, and recorded 400 anonymous
 * events where the customer needed one attributable run.
 *
 * ── SECURITY: this is DESCRIPTIVE, never AUTHORITATIVE ───────────────────────
 * Every signal below is a client-supplied header. A caller can send anything it
 * likes, so this must NEVER be used for authorization, tenancy, rate limiting,
 * or any access decision. The tenant boundary is, and stays, the server-resolved
 * user id from the API key (see lib/gateway/api-key.ts).
 *
 * What it is good for is exactly what an audit log needs: a truthful record of
 * what the client CLAIMED to be, stored alongside the decision. An assessor
 * asking "was this a person or a bot?" gets the evidence we actually have,
 * labelled as what it is. Attribution a customer can forge about their own
 * traffic is still worth recording — it is their audit trail, and forging it
 * only harms them.
 */

/** How much human judgement was plausibly in the loop when this prompt was sent. */
export type ActorKind =
  /** An autonomous coding/agent runtime. Acts in a loop without per-prompt review. */
  | 'agent'
  /** A programmatic SDK or framework call — a script, batch job, or backend. */
  | 'sdk'
  /** A browser. The closest thing to "a person typed this". */
  | 'browser'
  /** Nothing identifiable was sent. */
  | 'unknown'

export interface Actor {
  kind: ActorKind
  /** Display name of the client, e.g. "Claude Code". Null when unidentified. */
  client: string | null
  /** What the caller called itself, when it volunteered a name (X-Title). */
  title: string | null
  /** The raw User-Agent, truncated. Kept so an assessor can see the evidence. */
  ua: string | null
}

/**
 * Signature table, longest/most specific first.
 *
 * Matched against a lower-cased User-Agent. Deliberately a plain list rather
 * than a parser: User-Agent has no enforced grammar, every client invents its
 * own, and a substring table is both the honest model of that and trivial to
 * extend when a new agent appears.
 */
const SIGNATURES: ReadonlyArray<readonly [needle: string, client: string, kind: ActorKind]> = [
  // ── Autonomous agents ──────────────────────────────────────────────────────
  ['claude-code', 'Claude Code', 'agent'],
  ['claude-cli', 'Claude Code', 'agent'],
  ['cursor', 'Cursor', 'agent'],
  ['windsurf', 'Windsurf', 'agent'],
  ['cline', 'Cline', 'agent'],
  ['roo-cline', 'Roo Code', 'agent'],
  ['aider', 'Aider', 'agent'],
  ['goose', 'Goose', 'agent'],
  ['continue', 'Continue', 'agent'],
  ['opendevin', 'OpenHands', 'agent'],
  ['openhands', 'OpenHands', 'agent'],
  ['github-copilot', 'GitHub Copilot', 'agent'],
  ['copilot', 'GitHub Copilot', 'agent'],
  ['devin', 'Devin', 'agent'],

  // ── Frameworks that drive multi-step chains ────────────────────────────────
  ['langchain', 'LangChain', 'agent'],
  ['llama-index', 'LlamaIndex', 'agent'],
  ['llamaindex', 'LlamaIndex', 'agent'],
  ['autogen', 'AutoGen', 'agent'],
  ['crewai', 'CrewAI', 'agent'],

  // ── Plain SDKs and scripts ─────────────────────────────────────────────────
  ['openai-python', 'OpenAI SDK (Python)', 'sdk'],
  ['openai-node', 'OpenAI SDK (Node)', 'sdk'],
  ['anthropic-sdk', 'Anthropic SDK', 'sdk'],
  ['anthropic-python', 'Anthropic SDK (Python)', 'sdk'],
  ['python-requests', 'Python script', 'sdk'],
  ['httpx', 'Python script', 'sdk'],
  ['axios', 'Node script', 'sdk'],
  ['node-fetch', 'Node script', 'sdk'],
  ['okhttp', 'JVM client', 'sdk'],
  ['go-http-client', 'Go client', 'sdk'],
  ['curl', 'curl', 'sdk'],
  ['postman', 'Postman', 'sdk'],
  ['insomnia', 'Insomnia', 'sdk'],
]

/** Cap on stored header text. An audit column is not a place for unbounded input. */
const MAX_LEN = 200

const clean = (value: string | null | undefined): string | null => {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, MAX_LEN)
}

/**
 * Anything that reads like a browser.
 *
 * Checked AFTER the signature table on purpose: Electron-based agents ship a
 * Chrome-shaped User-Agent, so "contains Mozilla" would misfile Cursor as a
 * person sitting at a keyboard — the single most misleading answer this module
 * could give, since the whole point is telling those two apart.
 */
function looksLikeBrowser(ua: string): boolean {
  return /mozilla\/|applewebkit|gecko\/|chrome\/|safari\/|firefox\//.test(ua)
}

/**
 * Identify the caller from the headers it sent.
 *
 * Accepts a `Headers` object or a plain record, so route handlers, the proxy
 * and tests can all call it without adapting.
 */
export function identifyActor(
  headers: Headers | Record<string, string | string[] | undefined>,
): Actor {
  const get = (name: string): string | null => {
    if (typeof (headers as Headers).get === 'function') {
      return (headers as Headers).get(name)
    }
    const raw = (headers as Record<string, string | string[] | undefined>)[name]
    return Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null)
  }

  const uaRaw = clean(get('user-agent'))
  const title = clean(get('x-title'))

  // An explicit override, for customers who run their own named agents and want
  // them attributed by name in their own audit log. Still client-supplied, still
  // descriptive only — same trust level as everything else here.
  const declared = clean(get('x-houndshield-actor'))
  if (declared) {
    return { kind: 'agent', client: declared, title, ua: uaRaw }
  }

  if (!uaRaw) {
    // No User-Agent at all. A named app is still better than nothing.
    return { kind: title ? 'sdk' : 'unknown', client: title, title, ua: null }
  }

  const ua = uaRaw.toLowerCase()
  for (const [needle, client, kind] of SIGNATURES) {
    if (ua.includes(needle)) return { kind, client, title, ua: uaRaw }
  }

  if (looksLikeBrowser(ua)) {
    return { kind: 'browser', client: title ?? 'Browser', title, ua: uaRaw }
  }

  return { kind: 'unknown', client: title, title, ua: uaRaw }
}

/** Human-readable label for a dashboard row. Never invents a name. */
export function actorLabel(actor: Actor): string {
  if (actor.client) return actor.client
  switch (actor.kind) {
    case 'agent':
      return 'Unnamed agent'
    case 'sdk':
      return 'Unnamed script'
    case 'browser':
      return 'Browser'
    default:
      return 'Unidentified'
  }
}

/**
 * True when this prompt was sent by something that acts without a human
 * reviewing each request. The number a compliance officer actually wants.
 */
export function isAutonomous(actor: Actor): boolean {
  return actor.kind === 'agent'
}
