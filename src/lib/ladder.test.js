import { describe, it, expect } from 'vitest'
import { round2, incrementRungPrices, nextRungPrice } from './ladder.js'

describe('round2', () => {
  it('rounds to cents', () => {
    expect(round2(42.857)).toBe(42.86)
    expect(round2(100)).toBe(100)
  })
})

describe('incrementRungPrices — 5% steps', () => {
  it('descends in 5%-of-price steps from the top', () => {
    expect(incrementRungPrices(100, { stepPct: 0.05, count: 3 })).toEqual([95, 90, 85])
  })

  it('scales with price (5% of a $300 stock = $15 steps)', () => {
    expect(incrementRungPrices(300, { stepPct: 0.05, count: 2 })).toEqual([285, 270])
  })

  it('rounds odd steps to cents', () => {
    // 5% of 295.56 = 14.778 -> 280.78, 266.00, ...
    expect(incrementRungPrices(295.56, { stepPct: 0.05, count: 2 })).toEqual([280.78, 266.0])
  })

  it('stops before going at or below $0', () => {
    expect(incrementRungPrices(10, { stepPct: 0.5, count: 5 })).toEqual([5])
  })

  it('returns [] for a non-positive or blank price', () => {
    expect(incrementRungPrices('', { count: 3 })).toEqual([])
    expect(incrementRungPrices(0, { count: 3 })).toEqual([])
  })
})

describe('nextRungPrice', () => {
  it('steps one 5% increment below the basis', () => {
    expect(nextRungPrice(90, 100, 0.05)).toBe(85) // 100*0.05 = 5 below 90
  })
  it('never returns negative', () => {
    expect(nextRungPrice(3, 100, 0.05)).toBe(0)
  })
})
