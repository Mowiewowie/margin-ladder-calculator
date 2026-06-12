import { describe, it, expect } from 'vitest'
import { isMarketOpen } from './marketHours.js'

// 2026-06-15 is a Monday; June is EDT (UTC-4), so 14:00Z = 10:00am ET.
describe('isMarketOpen', () => {
  it('is open on a weekday during 9:30am–4:00pm ET', () => {
    expect(isMarketOpen(new Date('2026-06-15T14:00:00Z'))).toBe(true) // 10:00 ET
    expect(isMarketOpen(new Date('2026-06-15T19:59:00Z'))).toBe(true) // 15:59 ET
  })

  it('is closed before the open and after the close', () => {
    expect(isMarketOpen(new Date('2026-06-15T13:00:00Z'))).toBe(false) // 09:00 ET
    expect(isMarketOpen(new Date('2026-06-15T20:00:00Z'))).toBe(false) // 16:00 ET (exclusive)
    expect(isMarketOpen(new Date('2026-06-15T23:30:00Z'))).toBe(false) // 19:30 ET
  })

  it('is closed on weekends', () => {
    expect(isMarketOpen(new Date('2026-06-13T14:00:00Z'))).toBe(false) // Saturday
    expect(isMarketOpen(new Date('2026-06-14T14:00:00Z'))).toBe(false) // Sunday
  })
})
