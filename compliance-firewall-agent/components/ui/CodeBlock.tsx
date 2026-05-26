'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
}

export function CodeBlock({ code, language = 'bash', filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="code-block w-full">
      <div className="code-header justify-between">
        <div className="flex items-center gap-1.5">
          <span className="code-dot bg-[#FF5F57]" />
          <span className="code-dot bg-[#FFBD2E]" />
          <span className="code-dot bg-[#28C840]" />
          {filename && (
            <span className="ml-2 text-xs text-[var(--hs-ink-tertiary)] font-[var(--font-mono)]">
              {filename}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {language && (
            <span className="text-[10px] text-[var(--hs-ink-tertiary)] font-[var(--font-mono)] uppercase tracking-wider">
              {language}
            </span>
          )}
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy code"
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-[var(--hs-ink-tertiary)] hover:text-white hover:bg-white/10 transition-colors font-[var(--font-body)]"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code
          className="font-[var(--font-mono)] text-[var(--hs-steel-light)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {code}
        </code>
      </pre>
    </div>
  )
}
