import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import App from './App.jsx'
import { ACCOUNT_STORAGE_KEY } from './lib/constants.js'

afterEach(() => {
  cleanup()
  window.localStorage.clear() // App persists the account; start each test fresh
})

// The default account has one position with no ticker, so no network is hit.
describe('App (integration smoke)', () => {
  it('renders the account, default position and its ladder', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /Margin Ladder Calculator/i })).toBeInTheDocument()
    expect(screen.getByText('Account Summary')).toBeInTheDocument()
    // The default demo position's ladder rows render (e.g. the $90 rung's call price).
    expect(screen.getAllByLabelText('Buy price').length).toBeGreaterThan(0)
  })

  it('restores a saved account from localStorage instead of the defaults', () => {
    const saved = {
      loan: 0,
      positions: [
        { id: 'pX', ticker: '', shares: 777, avgCost: 10, eprPct: 40, manualPrice: 20, rungs: [] },
      ],
    }
    window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(saved))
    render(<App />)
    // Shows the restored 777 shares, not the default 1000.
    expect(screen.getByDisplayValue('777')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('1000')).toBeNull()
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
