/**
 * Turn the plain text Brain AI produces into clickable segments.
 *
 * Brain AI answers routinely name a destination — "try the free scan at
 * /demo#snapshot", "docs at houndshield.com/docs", "email info@houndshield.com".
 * Every one of those rendered as dead grey text, because the chat bubble prints
 * `{msg.text}` and `cleanAnswer()` deliberately flattens markdown links
 * (`[text](url)` → `text (url)`) so no literal `[` or `]` leaks on screen. The
 * founder's report on 2026-08-07 was exactly this: the assistant tells you where
 * to go and then makes you type it into the address bar yourself.
 *
 * This is the parser half — pure, no React — so it can be tested on its own and
 * shared by every surface that renders an answer. `components/brain/AnswerText`
 * is the rendering half.
 *
 * ── What is deliberately NOT linked ──────────────────────────────────────────
 * A greedy path matcher is worse than no links at all, because Brain AI talks
 * about compliance all day and that text is full of slashes and hyphens:
 *
 *   "and/or", "N/A", "24/7", "$30K/month"   → the `/` follows a word character,
 *                                              and a path must start the token
 *   "NIST 800-171", "-203 to +110"          → no leading slash at all
 *   "164.312(d)"                            → not a path shape
 *
 * So a site path must begin the token (start of string, whitespace, or an
 * opening bracket) and start with a letter. Trailing sentence punctuation is
 * pushed back into the text — "see /pricing." must not link to `/pricing.` —
 * and unbalanced closing parens are given back too, so "(see /security)" links
 * to `/security`, not `/security)`.
 */

export type LinkSegment =
  | { kind: 'text'; text: string }
  | { kind: 'link'; text: string; href: string; external: boolean }

/** Our own hosts. A link to one of these is internal navigation, not an exit. */
const OWN_HOST = /^(?:www\.)?houndshield\.com$/i

/**
 * One pass, four alternatives, longest-first so a full URL wins over the bare
 * domain inside it.
 *
 *   1. absolute URL          https://example.com/x
 *   2. bare own-domain       houndshield.com/docs   (people write it without a scheme)
 *   3. email                 info@houndshield.com
 *   4. site-relative path    /demo#snapshot
 */
const TOKEN =
  /(https?:\/\/[^\s<>"']+)|((?:www\.)?houndshield\.com(?:\/[^\s<>"']*)?)|([A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z0-9.-]+)|((?:^|(?<=[\s([]))\/[A-Za-z][A-Za-z0-9\-_]*(?:\/[A-Za-z0-9\-_.]+)*(?:#[A-Za-z0-9\-_]+)?)/g

/** Sentence punctuation that a URL at the end of a sentence swallows. */
const TRAILING = /[.,;:!?]+$/

/**
 * Give back characters that belong to the sentence, not the link.
 * Returns the href-worthy head and the tail to re-emit as plain text.
 */
function trimTail(token: string): [string, string] {
  let head = token
  let tail = ''

  // Unbalanced ')' — "(see /security)" must not link to "/security)".
  for (;;) {
    const punct = head.match(TRAILING)
    if (punct) {
      head = head.slice(0, -punct[0].length)
      tail = punct[0] + tail
      continue
    }
    if (
      head.endsWith(')') &&
      (head.match(/\)/g)?.length ?? 0) > (head.match(/\(/g)?.length ?? 0)
    ) {
      head = head.slice(0, -1)
      tail = ')' + tail
      continue
    }
    break
  }

  return [head, tail]
}

/** Build the href for a matched token, or null if it isn't worth linking. */
function toHref(token: string): { href: string; external: boolean } | null {
  if (token.startsWith('/')) return { href: token, external: false }

  if (token.includes('@') && !token.includes('/')) {
    return { href: `mailto:${token}`, external: false }
  }

  const withScheme = /^https?:\/\//i.test(token) ? token : `https://${token}`
  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    return null
  }

  // Our own domain: hand React Router a path so it stays a client-side
  // navigation instead of a full page reload out and back in.
  if (OWN_HOST.test(url.hostname)) {
    return { href: `${url.pathname}${url.search}${url.hash}` || '/', external: false }
  }

  return { href: url.toString(), external: true }
}

/**
 * Split an answer into text and link segments, in order. Concatenating every
 * segment's `text` always reproduces the input exactly — nothing is dropped,
 * nothing is reworded. That invariant is what makes this safe to put in front of
 * a compliance assistant's output.
 */
export function linkify(input: string): LinkSegment[] {
  if (!input) return []

  const out: LinkSegment[] = []
  let cursor = 0

  const pushText = (text: string) => {
    if (!text) return
    const last = out[out.length - 1]
    if (last?.kind === 'text') last.text += text
    else out.push({ kind: 'text', text })
  }

  TOKEN.lastIndex = 0
  for (let m = TOKEN.exec(input); m !== null; m = TOKEN.exec(input)) {
    const raw = m[0]
    const [head, tail] = trimTail(raw)
    const link = head ? toHref(head) : null

    pushText(input.slice(cursor, m.index))
    if (link) {
      out.push({ kind: 'link', text: head, href: link.href, external: link.external })
      pushText(tail)
    } else {
      pushText(raw)
    }
    cursor = m.index + raw.length
  }

  pushText(input.slice(cursor))
  return out
}
