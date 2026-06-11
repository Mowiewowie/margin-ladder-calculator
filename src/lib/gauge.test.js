import { describe, it, expect } from 'vitest'
import { clampPct, toPctOfMax } from './gauge.js'

describe('clampPct', () => {
  it('clamps to the 0–100 range', () => {
    expect(clampPct(50)).toBe(50)
    expect(clampPct(-10)).toBe(0)
    expect(clampPct(140)).toBe(100)
  })
  it('returns 0 for non-finite input', () => {
    expect(clampPct(NaN)).toBe(0)
    expect(clampPct(Infinity)).toBe(100)
  })
})

describe('toPctOfMax', () => {
  it('maps a value within [0, max] to a percentage', () => {
    expect(toPctOfMax(50, 200)).toBe(25)
    expect(toPctOfMax(200, 200)).toBe(100)
  })
  it('clamps out-of-range values', () => {
    expect(toPctOfMax(300, 200)).toBe(100)
    expect(toPctOfMax(-5, 200)).toBe(0)
  })
  it('returns 0 when max is not positive', () => {
    expect(toPctOfMax(50, 0)).toBe(0)
  })
})
