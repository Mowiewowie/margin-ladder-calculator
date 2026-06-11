import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatSignedCurrency,
  formatPercent,
  formatShares,
} from './format.js'

describe('formatCurrency', () => {
  it('formats dollars with separators', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50')
    expect(formatCurrency(0)).toBe('$0.00')
  })
  it('renders an em dash for non-finite values', () => {
    expect(formatCurrency(Infinity)).toBe('—')
    expect(formatCurrency(NaN)).toBe('—')
  })
})

describe('formatSignedCurrency', () => {
  it('shows explicit + and − signs', () => {
    expect(formatSignedCurrency(5000)).toBe('+$5,000.00')
    expect(formatSignedCurrency(-5000)).toBe('−$5,000.00')
    expect(formatSignedCurrency(0)).toBe('$0.00')
  })
})

describe('formatPercent', () => {
  it('converts a fraction to a percent string', () => {
    expect(formatPercent(0.6667)).toBe('66.7%')
    expect(formatPercent(1)).toBe('100.0%')
    expect(formatPercent(0.3, 0)).toBe('30%')
  })
  it('renders an em dash for non-finite values', () => {
    expect(formatPercent(NaN)).toBe('—')
  })
})

describe('formatShares', () => {
  it('formats whole shares with separators', () => {
    expect(formatShares(1500)).toBe('1,500')
    expect(formatShares(2500.4)).toBe('2,500')
  })
})
