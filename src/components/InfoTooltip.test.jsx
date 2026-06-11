import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import InfoTooltip from './InfoTooltip.jsx'

afterEach(cleanup)

describe('InfoTooltip', () => {
  it('renders nothing when there is no content', () => {
    const { container } = render(<InfoTooltip term="does-not-exist" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows glossary content on click and hides on Escape', () => {
    render(<InfoTooltip term="equityPct" label="equity percent" />)
    const btn = screen.getByRole('button')

    expect(screen.queryByRole('tooltip')).toBeNull()

    fireEvent.click(btn)
    const tip = screen.getByRole('tooltip')
    expect(tip).toHaveTextContent(/margin call happens/i)

    fireEvent.keyDown(btn, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('reveals on focus and hides on blur (keyboard accessible)', () => {
    render(<InfoTooltip text="custom help" label="thing" />)
    const btn = screen.getByRole('button')

    fireEvent.focus(btn)
    expect(screen.getByRole('tooltip')).toHaveTextContent('custom help')

    fireEvent.blur(btn)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('renders the bubble in a portal on document.body (not clipped by parents)', () => {
    const { container } = render(<InfoTooltip text="portaled" />)
    fireEvent.click(screen.getByRole('button'))
    const tip = screen.getByRole('tooltip')
    // The bubble lives on body, outside the component's own subtree.
    expect(container.contains(tip)).toBe(false)
    expect(document.body.contains(tip)).toBe(true)
  })
})
