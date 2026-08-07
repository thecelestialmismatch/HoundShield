import Link from 'next/link'
import { linkify } from '@/lib/brain-ai/linkify'

/**
 * Renders a Brain AI answer with its destinations clickable.
 *
 * Drop-in for `{text}` anywhere an answer is printed. The parsing lives in
 * `lib/brain-ai/linkify` and is covered there; this file is only the markup, and
 * the three decisions in it:
 *
 *  1. Internal destinations use `next/link`, so "/demo#snapshot" is a client-side
 *     navigation rather than a full reload out of the app and back into it.
 *  2. External destinations get `target="_blank"` plus `rel="noopener noreferrer"`.
 *     `noopener` is not decoration — without it the opened page gets a live
 *     `window.opener` handle back into a signed-in Command Center tab.
 *  3. The link text is whatever the model wrote, never the resolved href. If
 *     Brain AI says "houndshield.com/docs" the user reads "houndshield.com/docs"
 *     and lands on /docs. Rewriting visible text under someone in a compliance
 *     assistant is not a formatting choice.
 *
 * `mailto:` is emitted as a plain <a>: next/link would try to route it.
 */
export function AnswerText({ text, className }: { text: string; className?: string }) {
  const segments = linkify(text)

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.kind === 'text') return <span key={i}>{seg.text}</span>

        const style = className ?? 'underline underline-offset-2 decoration-current/40 hover:decoration-current'

        if (seg.external) {
          return (
            <a
              key={i}
              href={seg.href}
              target="_blank"
              rel="noopener noreferrer"
              className={style}
            >
              {seg.text}
            </a>
          )
        }

        if (seg.href.startsWith('mailto:')) {
          return (
            <a key={i} href={seg.href} className={style}>
              {seg.text}
            </a>
          )
        }

        return (
          <Link key={i} href={seg.href} className={style}>
            {seg.text}
          </Link>
        )
      })}
    </>
  )
}
