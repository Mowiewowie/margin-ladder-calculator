import { describe, it, expect, vi } from 'vitest'
import { createQuoteProvider, fetchQuotes } from './priceService.js'

function mockFetch(payload, { ok = true, status = 200 } = {}) {
  return vi.fn(async () => ({ ok, status, json: async () => payload }))
}

describe('createQuoteProvider', () => {
  it('returns the current price from a Finnhub /quote payload', async () => {
    const fetchFn = mockFetch({ c: 191.5, pc: 189, d: 2.5, dp: 1.32, t: 1700000000 })
    const fetchQuote = createQuoteProvider({ apiKey: 'KEY', fetchFn })

    const q = await fetchQuote('aapl')
    expect(q).toMatchObject({ ticker: 'AAPL', price: 191.5, prevClose: 189, changePct: 1.32 })

    // Calls the quote endpoint with symbol + token.
    const url = fetchFn.mock.calls[0][0]
    expect(url).toContain('symbol=AAPL')
    expect(url).toContain('token=KEY')
  })

  it('rejects with NO_API_KEY when no key is configured', async () => {
    const fetchQuote = createQuoteProvider({ apiKey: '', fetchFn: mockFetch({}) })
    await expect(fetchQuote('AAPL')).rejects.toThrow('NO_API_KEY')
  })

  it('rejects with NO_TICKER for blank symbols', async () => {
    const fetchQuote = createQuoteProvider({ apiKey: 'KEY', fetchFn: mockFetch({}) })
    await expect(fetchQuote('   ')).rejects.toThrow('NO_TICKER')
  })

  it('rejects with NO_DATA when Finnhub returns c === 0 (unknown symbol)', async () => {
    const fetchQuote = createQuoteProvider({ apiKey: 'KEY', fetchFn: mockFetch({ c: 0 }) })
    await expect(fetchQuote('ZZZZ')).rejects.toThrow('NO_DATA')
  })

  it('rejects with HTTP_<status> on a failed response', async () => {
    const fetchFn = mockFetch({}, { ok: false, status: 429 })
    const fetchQuote = createQuoteProvider({ apiKey: 'KEY', fetchFn })
    await expect(fetchQuote('AAPL')).rejects.toThrow('HTTP_429')
  })
})

describe('fetchQuotes', () => {
  it('returns a per-ticker map and tolerates individual failures', async () => {
    const provider = vi.fn(async (t) => {
      if (t === 'BAD') throw new Error('NO_DATA')
      return { ticker: t, price: 100 }
    })

    const map = await fetchQuotes(['AAPL', 'bad', 'AAPL'], provider) // dedupes + upper-cases
    expect(map.AAPL).toMatchObject({ status: 'live', price: 100 })
    expect(map.BAD).toMatchObject({ status: 'error', error: 'NO_DATA' })
    // 'AAPL' deduped -> provider called once for it, once for BAD.
    expect(provider).toHaveBeenCalledTimes(2)
  })

  it('returns an empty map for no tickers', async () => {
    expect(await fetchQuotes([], vi.fn())).toEqual({})
  })
})
