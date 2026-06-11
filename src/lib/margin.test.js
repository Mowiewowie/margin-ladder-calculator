import { describe, it, expect } from 'vitest'
import {
  marketValue,
  equity,
  equityPct,
  isCalled,
  marginCallPrice,
  maxSharesBeforeCall,
  buyingPower,
} from './margin.js'

describe('primitives', () => {
  it('marketValue = shares * price', () => {
    expect(marketValue(1000, 100)).toBe(100000)
    expect(marketValue(0, 100)).toBe(0)
  })

  it('equity = market value - loan', () => {
    expect(equity(1000, 100, 0)).toBe(100000)
    expect(equity(1000, 100, 40000)).toBe(60000)
    expect(equity(1000, 50, 60000)).toBe(-10000) // underwater
  })

  it('equityPct = equity / market value', () => {
    expect(equityPct(1000, 100, 0)).toBe(1)
    expect(equityPct(1500, 90, 45000)).toBeCloseTo(0.6667, 4)
  })

  it('equityPct guards against zero market value', () => {
    expect(equityPct(0, 100, 0)).toBeNaN()
    expect(equityPct(1000, 0, 0)).toBeNaN()
  })
})

describe('isCalled', () => {
  const m = 0.3
  it('is false when equity% is above the requirement', () => {
    expect(isCalled(1500, 90, 45000, m)).toBe(false) // 66.7%
  })
  it('is true when equity% drops below the requirement', () => {
    // 1500 sh, loan 45000, price 45 -> MV 67500, equity 22500, 33.3% > 30 ok
    // drop to price 42 -> MV 63000, equity 18000, 28.6% < 30 -> called
    expect(isCalled(1500, 42, 45000, m)).toBe(true)
  })
  it('is false exactly at the boundary (equity% == m)', () => {
    // Construct a position where equity% == 0.30 exactly.
    // price 100, shares 1000 -> MV 100000; want equity 30000 -> loan 70000
    expect(equityPct(1000, 100, 70000)).toBeCloseTo(0.3, 10)
    expect(isCalled(1000, 100, 70000, 0.3)).toBe(false)
  })
})

describe('marginCallPrice', () => {
  it('is 0 when there is no loan (nothing to call)', () => {
    expect(marginCallPrice(1000, 0, 0.3)).toBe(0)
  })

  it('worked example: 1500 sh, $45k loan, 30% -> ~$42.857', () => {
    // P_call = 45000 / (1500 * 0.70) = 42.857...
    expect(marginCallPrice(1500, 45000, 0.3)).toBeCloseTo(42.857, 3)
  })

  it('rises as the loan grows (more leverage = worse call price)', () => {
    const a = marginCallPrice(1500, 45000, 0.3)
    const b = marginCallPrice(2000, 85000, 0.3) // bought more on margin
    expect(b).toBeGreaterThan(a)
  })

  it('guards: zero shares -> Infinity, m >= 1 -> Infinity', () => {
    expect(marginCallPrice(0, 1000, 0.3)).toBe(Infinity)
    expect(marginCallPrice(1000, 1000, 1)).toBe(Infinity)
  })
})

describe('maxSharesBeforeCall', () => {
  const m = 0.3
  it('matches the closed-form for a no-loan start', () => {
    // S=1000, price=90, loan=0, m=0.3
    // k = (1000*90*0.7 - 0) / (0.3*90) = 63000 / 27 = 2333.33
    expect(maxSharesBeforeCall(1000, 90, 0, m)).toBeCloseTo(2333.333, 3)
  })

  it('buying exactly k_max lands equity% at the requirement', () => {
    const S = 1000
    const price = 90
    const k = maxSharesBeforeCall(S, price, 0, m)
    // Fund the buy on margin: loan grows by k*price, shares by k.
    const pct = equityPct(S + k, price, k * price)
    expect(pct).toBeCloseTo(m, 6)
  })

  it('returns 0 when already past the limit', () => {
    // Heavily indebted: loan exceeds what equity supports.
    expect(maxSharesBeforeCall(1000, 50, 60000, m)).toBe(0)
  })

  it('returns Infinity when there is no maintenance requirement', () => {
    expect(maxSharesBeforeCall(1000, 90, 0, 0)).toBe(Infinity)
  })
})

describe('buyingPower', () => {
  it('no-loan position has buying power = equity under 50% margin', () => {
    // equity 100000, initial 0.5 -> 100000/0.5 - 100000 = 100000
    expect(buyingPower(1000, 100, 0, 0.5)).toBe(100000)
  })
  it('is 0 when equity is wiped out', () => {
    expect(buyingPower(1000, 50, 60000, 0.5)).toBe(0)
  })
})
