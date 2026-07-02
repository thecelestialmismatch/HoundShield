'use client'

import { useState } from 'react'

/** Demo gateway-box copy button — text flips to "Copied" on click. */
export function CopyText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text).catch(() => undefined)
        setCopied(true)
      }}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}
