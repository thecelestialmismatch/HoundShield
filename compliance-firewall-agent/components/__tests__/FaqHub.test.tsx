import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { FaqHub } from '../seo/FaqHub'
import { faqHubGroups } from '@/lib/seo/faqs'

const answerOf = (questionText: string) =>
  screen
    .getByText(questionText)
    .closest('[data-testid="faq-item"]')!
    .querySelector('[data-testid="faq-answer"]')!

describe('FaqHub — searchable consolidated FAQ', () => {
  it('renders the search box and a jump-nav anchor for every group', () => {
    render(<FaqHub groups={faqHubGroups} />)
    expect(screen.getByLabelText(/search frequently asked questions/i)).toBeTruthy()
    for (const g of faqHubGroups) {
      expect(document.querySelector(`a[href="#${g.id}"]`), `missing anchor #${g.id}`).toBeTruthy()
      expect(document.getElementById(g.id), `missing section #${g.id}`).toBeTruthy()
    }
  })

  it('filters to matching answers and hides the category nav while searching', () => {
    render(<FaqHub groups={faqHubGroups} />)
    fireEvent.change(screen.getByLabelText(/search frequently asked questions/i), {
      target: { value: 'sprs' },
    })
    expect(document.querySelector('nav[aria-label="FAQ categories"]')).toBeNull()
    // A question with no SPRS mention drops out; matches remain.
    expect(screen.queryByText('What is HoundShield?')).toBeNull()
    expect(screen.getAllByTestId('faq-item').length).toBeGreaterThan(0)
  })

  it('shows an empty state with a contact link when nothing matches', () => {
    render(<FaqHub groups={faqHubGroups} />)
    fireEvent.change(screen.getByLabelText(/search frequently asked questions/i), {
      target: { value: 'zzz-no-such-answer' },
    })
    expect(screen.getByText(/No answers match/i)).toBeTruthy()
    expect(document.querySelector('a[href="/contact"]')).toBeTruthy()
  })

  it('the clear button restores the full list', () => {
    render(<FaqHub groups={faqHubGroups} />)
    const input = screen.getByLabelText(/search frequently asked questions/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'sprs' } })
    fireEvent.click(screen.getByLabelText('Clear search'))
    expect(input.value).toBe('')
    expect(screen.getByText('What is HoundShield?')).toBeTruthy()
  })

  it('collapses any open answer when the filter changes (no stale open item)', () => {
    render(<FaqHub groups={faqHubGroups} />)
    const trigger = screen.getByText('What is HoundShield?').closest('button')!
    fireEvent.click(trigger)
    expect(answerOf('What is HoundShield?').getAttribute('aria-hidden')).toBe('false')

    // 'houndshield' still matches this question, but changing the item list
    // must reset open-state so nothing is left unexpectedly expanded.
    fireEvent.change(screen.getByLabelText(/search frequently asked questions/i), {
      target: { value: 'houndshield' },
    })
    expect(answerOf('What is HoundShield?').getAttribute('aria-hidden')).toBe('true')
  })

  it('renders actionable answer chips inside an opened answer', () => {
    render(<FaqHub groups={faqHubGroups} />)
    fireEvent.click(screen.getByText('What is HoundShield?').closest('button')!)
    const item = screen.getByText('What is HoundShield?').closest('[data-testid="faq-item"]')!
    expect(within(item as HTMLElement).getByText('How it works')).toBeTruthy()
    expect(
      within(item as HTMLElement).getByLabelText(/copy a shareable link/i),
    ).toBeTruthy()
  })
})
