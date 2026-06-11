import { describe, it, expect } from 'vitest'
import { sanitizeNumericInput, toInputString } from './number.js'

describe('sanitizeNumericInput — strips leading zeros (the ladder bug)', () => {
  it('removes a stray leading zero', () => {
    expect(sanitizeNumericInput('01540')).toBe('1540')
    expect(sanitizeNumericInput('085')).toBe('85')
    expect(sanitizeNumericInput('007')).toBe('7')
  })

  it('keeps a single standalone zero', () => {
    expect(sanitizeNumericInput('0')).toBe('0')
  })

  it('preserves decimals (including a leading "0.")', () => {
    expect(sanitizeNumericInput('0.5')).toBe('0.5')
    expect(sanitizeNumericInput('00.5')).toBe('0.5')
    expect(sanitizeNumericInput('42.86')).toBe('42.86')
    expect(sanitizeNumericInput('42.')).toBe('42.') // mid-typing
  })

  it('collapses extra decimal points', () => {
    expect(sanitizeNumericInput('12.3.4')).toBe('12.34')
  })

  it('drops non-numeric characters', () => {
    expect(sanitizeNumericInput('1,540')).toBe('1540')
    expect(sanitizeNumericInput('abc12')).toBe('12')
    expect(sanitizeNumericInput('-5')).toBe('5')
  })

  it('handles empty / nullish input', () => {
    expect(sanitizeNumericInput('')).toBe('')
    expect(sanitizeNumericInput(null)).toBe('')
    expect(sanitizeNumericInput(undefined)).toBe('')
  })
})

describe('toInputString', () => {
  it('renders numbers and strings, blanks empty/nullish', () => {
    expect(toInputString(1540)).toBe('1540')
    expect(toInputString('85')).toBe('85')
    expect(toInputString('')).toBe('')
    expect(toInputString(null)).toBe('')
    expect(toInputString(0)).toBe('0')
  })
})
