import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import AccountSummary from './AccountSummary.jsx'
import { computeAccount } from '../lib/account.js'

afterEach(cleanup)

const PRICES = { lastUpdated: null, loading: false, refresh: vi.fn() }

function summaryFor(account) {
  return computeAccount(account).summary
}

const HEALTHY = {
  loan: 0,
  positions: [{ id: 'p1', ticker: '', shares: 1000, avgCost: 100, eprPct: 30, price: 100, rungs: [] }],
}

describe('AccountSummary', () => {
  it('renders the value/loan, margin-call risk and performance groups', () => {
    render(<AccountSummary summary={summaryFor(HEALTHY)} loan={0} onLoanChange={() => {}} prices={PRICES} />)
    expect(screen.getByText(/Account — Value & Loan/i)).toBeInTheDocument()
    expect(screen.getByText(/Account — Margin-Call Risk/i)).toBeInTheDocument()
    expect(screen.getByText(/Performance/i)).toBeInTheDocument()
  })

  it('warns when the account is in a margin call', () => {
    const called = {
      loan: 40000,
      positions: [{ id: 'p1', ticker: '', shares: 1000, avgCost: 100, eprPct: 30, price: 50, rungs: [] }],
    }
    const summary = summaryFor(called)
    expect(summary.called).toBe(true)
    render(<AccountSummary summary={summary} loan={40000} onLoanChange={() => {}} prices={PRICES} />)
    expect(screen.getByText(/this is a margin call/i)).toBeInTheDocument()
  })

  it('does not warn for a healthy account', () => {
    render(<AccountSummary summary={summaryFor(HEALTHY)} loan={0} onLoanChange={() => {}} prices={PRICES} />)
    expect(screen.queryByText(/this is a margin call/i)).toBeNull()
  })
})
