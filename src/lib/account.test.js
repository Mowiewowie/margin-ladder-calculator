import { describe, it, expect } from 'vitest'
import {
  accountSnapshot,
  symbolCallPrice,
  maxSharesBeforeCallAccount,
  computePositionLadder,
  computeAccount,
  cushionFraction,
} from './account.js'

describe('cushionFraction', () => {
  it('is the fractional drop from price to the call price', () => {
    expect(cushionFraction(100, 75)).toBeCloseTo(0.25, 6)
    expect(cushionFraction(100, 100)).toBe(0)
  })
  it('is negative once the call price is above the price (a call)', () => {
    expect(cushionFraction(100, 120)).toBeCloseTo(-0.2, 6)
  })
  it('returns 0 for a non-positive price', () => {
    expect(cushionFraction(0, 50)).toBe(0)
  })
})

// A single AAPL-like position reproducing the original worked example, so the
// account math is provably a generalization of the single-stock case.
const SINGLE = [{ shares: 1000, price: 100, eprPct: 30 }]

describe('accountSnapshot', () => {
  it('single position, no loan: 100% equity, not called', () => {
    const s = accountSnapshot(SINGLE, 0)
    expect(s.lmv).toBe(100000)
    expect(s.equity).toBe(100000)
    expect(s.equityPct).toBe(1)
    expect(s.maintenanceReq).toBe(30000)
    expect(s.excessEquity).toBe(70000)
    expect(s.called).toBe(false)
  })

  it('aggregates two stocks with different maintenance rates', () => {
    const positions = [
      { shares: 1000, price: 100, eprPct: 30 }, // MV 100k, maint 30k
      { shares: 200, price: 50, eprPct: 50 }, // MV 10k, maint 5k
    ]
    const s = accountSnapshot(positions, 40000)
    expect(s.lmv).toBe(110000)
    expect(s.maintenanceReq).toBe(35000)
    expect(s.equity).toBe(70000) // 110k - 40k
    expect(s.excessEquity).toBe(35000) // 70k - 35k
    expect(s.called).toBe(false)
  })

  it('flags a call when equity falls below the maintenance requirement', () => {
    // 1000 sh @ 50 = 50k MV, maint 15k, loan 40k -> equity 10k < 15k.
    const s = accountSnapshot([{ shares: 1000, price: 50, eprPct: 30 }], 40000)
    expect(s.called).toBe(true)
    expect(s.excessEquity).toBe(-5000)
  })

  it('empty account is not called and has NaN ratios', () => {
    const s = accountSnapshot([], 0)
    expect(s.called).toBe(false)
    expect(Number.isNaN(s.equityPct)).toBe(true)
  })
})

describe('symbolCallPrice', () => {
  it('reduces to L / (S(1-m)) for a single position (~$42.857)', () => {
    expect(symbolCallPrice([{ shares: 1500, price: 90, eprPct: 30 }], 45000, 0)).toBeCloseTo(
      42.857,
      3
    )
  })

  it('is 0 when no loan (nothing to call)', () => {
    expect(symbolCallPrice(SINGLE, 0, 0)).toBe(0)
  })

  it('cross-collateralization lowers a stock’s call price', () => {
    // Same focus stock + loan, but a second strong position is added as collateral.
    const focusOnly = symbolCallPrice([{ shares: 1500, price: 90, eprPct: 30 }], 45000, 0)
    const withCollateral = symbolCallPrice(
      [
        { shares: 1500, price: 90, eprPct: 30 },
        { shares: 1000, price: 100, eprPct: 30 }, // extra collateral
      ],
      45000,
      0
    )
    expect(withCollateral).toBeLessThan(focusOnly)
    expect(withCollateral).toBe(0) // collateral fully covers the loan here
  })
})

describe('maxSharesBeforeCallAccount', () => {
  it('matches the single-stock closed form (no loan, price 90, 30%)', () => {
    // excess at price 90 = 90000*0.7 - 0 ... actually S*p*(1-m) - L over (p*m):
    // (1000*90*0.7) / (0.3*90) = 63000/27 = 2333.33
    expect(maxSharesBeforeCallAccount([{ shares: 1000, price: 100, eprPct: 30 }], 0, 0, 90)).toBeCloseTo(
      2333.333,
      3
    )
  })

  it('buying exactly k_max lands the account at maintenance', () => {
    const positions = [{ shares: 1000, price: 100, eprPct: 30 }]
    const price = 90
    const k = maxSharesBeforeCallAccount(positions, 0, 0, price)
    const after = accountSnapshot([{ shares: 1000 + k, price, eprPct: 30 }], k * price)
    expect(after.excessEquity).toBeCloseTo(0, 4)
  })
})

describe('computePositionLadder — single position matches original worked example', () => {
  const rows = computePositionLadder({
    position: { shares: 1000, avgCost: 100, eprPct: 30, price: 100, rungs: [{ id: 'r1', price: 90, shares: 500 }] },
    others: [],
    loan: 0,
  })

  it('buying 500 @ $90 on margin -> $45k loan, ~66.7% equity, $42.86 call', () => {
    const r = rows[0]
    expect(r.cumulativeShares).toBe(1500)
    expect(r.cumulativeLoan).toBe(45000)
    // "As the dip happens": the WHOLE 1500 shares are valued at the $90 rung
    // price -> MV $135k, equity $90k -> 66.7%.
    expect(r.equityPct).toBeCloseTo(0.6667, 4)
    expect(r.callPrice).toBeCloseTo(42.857, 3) // 45000 / (1500 * 0.70)
    expect(r.called).toBe(false)
  })
})

describe('computePositionLadder — a falling price calls the deep, over-leveraged rungs', () => {
  // High 76% maintenance + buying the dip: early rungs are fine, but the deepest
  // rung is a margin call because the drop erodes the existing shares too.
  const rows = computePositionLadder({
    position: {
      shares: 21000,
      avgCost: 14.95,
      eprPct: 76,
      price: 16.58,
      rungs: [
        { id: 'a', price: 15.4, shares: 1000 },
        { id: 'b', price: 14.6, shares: 2500 },
        { id: 'c', price: 13.8, shares: 2500 },
        { id: 'd', price: 13.12, shares: 1500 },
      ],
    },
    others: [],
    loan: 0,
  })

  it('keeps early rungs safe but flags the deepest rung as a margin call', () => {
    expect(rows[0].called).toBe(false) // $15.40
    expect(rows[1].called).toBe(false) // $14.60
    expect(rows[rows.length - 1].called).toBe(true) // $13.12
  })

  it('revalues the whole position at each rung price (existing shares drop too)', () => {
    // Row 1 @ $15.40: equity% = (22000*15.40 - 15400) / (22000*15.40).
    expect(rows[0].equityPct).toBeCloseTo((22000 * 15.4 - 15400) / (22000 * 15.4), 4)
  })
})

describe('computePositionLadder — cost basis and current price do NOT enter the call math', () => {
  const base = {
    position: { shares: 1000, avgCost: 50, eprPct: 30, price: 100, rungs: [{ id: 'r1', price: 90, shares: 500 }] },
    others: [],
    loan: 0,
  }

  it('changing the average cost basis leaves call price / called / equity% identical', () => {
    const a = computePositionLadder(base)[0]
    const b = computePositionLadder({ ...base, position: { ...base.position, avgCost: 14.95 } })[0]
    expect(b.callPrice).toBeCloseTo(a.callPrice, 10)
    expect(b.equityPct).toBeCloseTo(a.equityPct, 10)
    expect(b.called).toBe(a.called)
  })

  it('the call price depends only on loan, shares and maintenance (not the current price)', () => {
    const hi = computePositionLadder({ ...base, position: { ...base.position, price: 500 } })[0]
    const lo = computePositionLadder({ ...base, position: { ...base.position, price: 12 } })[0]
    // 45000 / (1500 * 0.70) regardless of the current price input.
    expect(hi.callPrice).toBeCloseTo(42.857, 3)
    expect(lo.callPrice).toBeCloseTo(42.857, 3)
  })
})

describe('computePositionLadder — buying on margin spends excess equity until a call', () => {
  // No collateral elsewhere; every margin buy erodes excess equity until a call.
  const rows = computePositionLadder({
    position: { shares: 1000, avgCost: 100, eprPct: 30, price: 100, rungs: [
      { id: 'a', price: 100, shares: 1000 },
      { id: 'b', price: 100, shares: 1000 },
      { id: 'c', price: 100, shares: 1000 },
    ] },
    others: [],
    loan: 0,
  })

  it('excess equity falls with each margin buy', () => {
    expect(rows[0].excessEquity).toBeGreaterThan(rows[1].excessEquity)
    expect(rows[1].excessEquity).toBeGreaterThan(rows[2].excessEquity)
  })

  it('eventually trips a margin call from over-borrowing', () => {
    // Start excess = 70k; each 1000@100 buy adds 30k maintenance -> called on the 3rd.
    expect(rows[2].called).toBe(true)
  })

  it('the max-shares suggestion shrinks as leverage grows', () => {
    expect(rows[1].maxSharesBeforeCall).toBeLessThan(rows[0].maxSharesBeforeCall)
  })
})

describe('computePositionLadder — account-aware with other stocks', () => {
  const others = [{ shares: 1000, price: 100, eprPct: 30 }] // strong collateral
  const rows = computePositionLadder({
    position: { shares: 500, avgCost: 80, eprPct: 30, price: 80, rungs: [
      { id: 'a', price: 80, shares: 500 },
      { id: 'b', price: 70, shares: 500 },
    ] },
    others,
    loan: 0,
  })

  it('shared loan accumulates across rungs', () => {
    expect(rows[0].cumulativeLoan).toBe(40000) // 500*80
    expect(rows[1].cumulativeLoan).toBe(75000) // +500*70
  })

  it('equity % is account-level (collateral keeps it healthy)', () => {
    // Account stays well above maintenance thanks to the strong other position.
    expect(rows[0].called).toBe(false)
    expect(rows[0].equityPct).toBeGreaterThan(0.3)
  })
})

describe('computeAccount', () => {
  const account = {
    loan: 0,
    positions: [
      { id: 'p1', ticker: 'AAA', shares: 1000, avgCost: 100, eprPct: 30, price: 100, rungs: [{ id: 'r1', price: 90, shares: 500 }] },
      { id: 'p2', ticker: 'BBB', shares: 200, avgCost: 40, eprPct: 50, price: 50, rungs: [] },
    ],
  }
  const { summary, positions } = computeAccount(account)

  it('auto-derives the loan from the ladders and summarizes the plan', () => {
    // plannedLoan = existing 0 + ladder buys (500*90 = 45k).
    expect(summary.plannedBuyCost).toBe(45000)
    expect(summary.loan).toBe(45000)
    // Planned MV: 145k (p1: 100k + 45k) + 10k (p2) = 155k.
    expect(summary.lmv).toBe(155000)
    expect(summary.maintenanceReq).toBe(48500) // 145k*.3 + 10k*.5
    expect(summary.totalInvested).toBe(153000) // 145k cost + 8k cost
    expect(summary.unrealizedPL).toBe(2000) // planned buys add 0 P&L
    expect(summary.called).toBe(false)
  })

  it('produces a per-position view with planned value, account-aware call price and ladder rows', () => {
    const p1 = positions.find((p) => p.id === 'p1')
    expect(p1.marketValue).toBe(145000) // planned (current + ladder)
    expect(p1.weightPct).toBeCloseTo(145000 / 155000, 6)
    expect(p1.ladderRows).toHaveLength(1)
    // 45k loan, 1500 shares @ 70% advance, less p2 collateral (5k): (45k-5k)/1050.
    expect(p1.callPrice).toBeCloseTo(38.095, 3)
  })

  it('handles blank/empty inputs without throwing', () => {
    const blank = { loan: '', positions: [{ id: 'x', ticker: '', shares: '', avgCost: '', eprPct: 30, price: '', rungs: [] }] }
    expect(() => computeAccount(blank)).not.toThrow()
  })
})
