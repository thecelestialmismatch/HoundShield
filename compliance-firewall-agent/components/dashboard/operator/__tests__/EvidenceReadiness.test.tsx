import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import { EvidenceReadiness } from '../EvidenceReadiness'

const source = readFileSync(resolve(process.cwd(), 'components/dashboard/operator/EvidenceReadiness.tsx'), 'utf8')
const localIntakeSource = readFileSync(resolve(process.cwd(), 'lib/evidence/local-intake.ts'), 'utf8')

describe('EvidenceReadiness — local-only dashboard contract', () => {
  it('renders an explicit browser-local boundary and human-review gate', () => {
    render(<EvidenceReadiness onOpenSettings={() => undefined} />)
    expect(screen.getByText('Evidence intake & verification')).toBeTruthy()
    expect(screen.getByText('Nothing leaves this browser session.')).toBeTruthy()
    expect(screen.getByText(/human approval required/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /choose a local pdf/i })).toBeTruthy()
  })

  it('contains no direct upload, analytics, or external model transport in the intake code', () => {
    const combined = `${source}\n${localIntakeSource}`
    expect(combined).not.toMatch(/\bfetch\s*\(/)
    expect(combined).not.toMatch(/XMLHttpRequest/)
    expect(combined).not.toMatch(/sendBeacon/)
    expect(combined).not.toMatch(/\/api\//)
    expect(combined).not.toMatch(/openai|anthropic|bedrock|gemini/i)
  })

  it('keeps the strict browser-memory privacy contract visible in the source', () => {
    expect(localIntakeSource).toContain("persistence: 'memory-only'")
    expect(localIntakeSource).toContain("transport: 'none'")
    expect(localIntakeSource).toContain('rawDocumentIncluded: false')
    expect(localIntakeSource).toContain('extractedTextIncluded: false')
  })
})
