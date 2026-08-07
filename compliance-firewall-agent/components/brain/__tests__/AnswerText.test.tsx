import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnswerText } from '../AnswerText'

/**
 * The parser is proven in lib/brain-ai/__tests__/linkify.test.ts. This file
 * proves the pixels: that a real anchor lands in the DOM with the right href and
 * the right safety attributes, because "linkify() returns a link segment" and
 * "the user can click it" are two different claims and only the second one was
 * reported broken.
 */

describe('AnswerText', () => {
  it('renders the destination Brain AI names as a real anchor', () => {
    render(
      <AnswerText text="No account yet? Try the free scan at /demo#snapshot — it runs in your browser." />,
    )

    const link = screen.getByRole('link', { name: '/demo#snapshot' })
    expect(link).toHaveAttribute('href', '/demo#snapshot')
    // Internal: same tab, no target.
    expect(link).not.toHaveAttribute('target')
  })

  it('keeps the surrounding sentence intact and in order', () => {
    const { container } = render(<AnswerText text="Start at /demo, then read /pricing." />)
    expect(container.textContent).toBe('Start at /demo, then read /pricing.')
  })

  it('opens external links safely', () => {
    render(<AnswerText text="Control text: https://csrc.nist.gov/pubs/sp/800/171/r2/final" />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('target', '_blank')
    // Without noopener the opened page keeps a live window.opener handle back
    // into a signed-in Command Center tab.
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
  })

  it('renders an email as mailto, not as a route', () => {
    render(<AnswerText text="Contact info@houndshield.com for help." />)
    expect(screen.getByRole('link')).toHaveAttribute('href', 'mailto:info@houndshield.com')
  })

  it('shows the text the model wrote, and routes to the resolved path', () => {
    render(<AnswerText text="Docs live at houndshield.com/docs today." />)

    const link = screen.getByRole('link', { name: 'houndshield.com/docs' })
    // Reader sees what was written; navigation stays inside the app.
    expect(link).toHaveAttribute('href', '/docs')
    expect(link).not.toHaveAttribute('target')
  })

  it('renders compliance prose with no links at all', () => {
    const line = 'HoundShield enforces SOC 2 and/or CMMC Level 2, monitored 24/7, scored -203 to +110.'
    const { container } = render(<AnswerText text={line} />)

    expect(screen.queryAllByRole('link')).toHaveLength(0)
    expect(container.textContent).toBe(line)
  })

  it('renders an empty answer without crashing', () => {
    const { container } = render(<AnswerText text="" />)
    expect(container.textContent).toBe('')
  })
})
