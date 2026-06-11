import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import App from './App.jsx'

afterEach(cleanup)

// The default account has one position with no ticker, so no network is hit.
describe('App (integration smoke)', () => {
  it('renders the account, default position and its ladder', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /Margin Ladder Calculator/i })).toBeInTheDocument()
    expect(screen.getByText('Account Summary')).toBeInTheDocument()
    // The default demo position's ladder rows render (e.g. the $90 rung's call price).
    expect(screen.getAllByLabelText('Buy price').length).toBeGreaterThan(0)
  })

  it('can add and remove a stock', () => {
    render(<App />)
    const before = screen.getAllByText(/Remove stock/i).length
    fireEvent.click(screen.getByRole('button', { name: /\+ Add stock/i }))
    const after = screen.getAllByText(/Remove stock/i).length
    expect(after).toBe(before + 1)

    fireEvent.click(screen.getAllByText(/Remove stock/i)[after - 1])
    expect(screen.getAllByText(/Remove stock/i).length).toBe(before)
  })

  it('updates the account when a ladder share field changes (no leading zero)', () => {
    render(<App />)
    const sharesInputs = screen.getAllByLabelText('Shares to buy')
    fireEvent.change(sharesInputs[0], { target: { value: '01540' } })
    expect(screen.getAllByLabelText('Shares to buy')[0].value).toBe('1540')
  })
})
