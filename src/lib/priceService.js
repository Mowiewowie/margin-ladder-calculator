// Stock price fetching via Finnhub (https://finnhub.io). The free /quote
// endpoint returns { c, h, l, o, pc, d, dp, t } where `c` is the current price.
// The API key comes from the VITE_FINNHUB_API_KEY env var (see .env.example).
//
// The provider is created via a factory so it can be unit-tested with a mock
// fetch and key — no network in tests.

const FINNHUB_QUOTE_URL = 'https://finnhub.io/api/v1/quote'

/** Read the build-time Finnhub key (empty string when unset). */
export function getApiKey() {
  // import.meta.env is provided by Vite; guard for non-Vite (test) contexts.
  try {
    return import.meta.env?.VITE_FINNHUB_API_KEY || ''
  } catch {
    return ''
  }
}

/** True when a key is configured, so the UI can explain manual fallback. */
export function hasApiKey() {
  return getApiKey().length > 0
}

/**
 * Build a single-ticker quote fetcher.
 * @returns {(ticker:string) => Promise<{ticker,price,prevClose,change,changePct,time}>}
 *          Rejects with Error codes: NO_API_KEY, HTTP_<status>, NO_DATA.
 */
export function createQuoteProvider({
  apiKey = getApiKey(),
  fetchFn = typeof fetch !== 'undefined' ? fetch : undefined,
  baseUrl = FINNHUB_QUOTE_URL,
} = {}) {
  return async function fetchQuote(ticker) {
    const symbol = String(ticker || '').trim().toUpperCase()
    if (!symbol) throw new Error('NO_TICKER')
    if (!apiKey) throw new Error('NO_API_KEY')

    const url = `${baseUrl}?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(apiKey)}`
    const res = await fetchFn(url)
    if (!res.ok) throw new Error(`HTTP_${res.status}`)

    const data = await res.json()
    // Finnhub returns c === 0 for unknown symbols / no data.
    if (!data || typeof data.c !== 'number' || data.c === 0) {
      throw new Error('NO_DATA')
    }
    return {
      ticker: symbol,
      price: data.c,
      prevClose: data.pc,
      change: data.d,
      changePct: data.dp,
      time: data.t,
    }
  }
}

/** Default provider wired to the env key and global fetch. */
export const fetchQuote = createQuoteProvider()

/**
 * Fetch quotes for many tickers at once, tolerating per-ticker failures.
 * @returns {Promise<Object>} map keyed by upper-cased ticker:
 *   { TICKER: { status: 'live', price, ... } | { status: 'error', error } }
 */
export async function fetchQuotes(tickers, provider = fetchQuote) {
  const unique = [...new Set((tickers || []).map((t) => String(t || '').trim().toUpperCase()).filter(Boolean))]
  const settled = await Promise.allSettled(unique.map((t) => provider(t)))

  const map = {}
  unique.forEach((ticker, i) => {
    const r = settled[i]
    if (r.status === 'fulfilled') {
      map[ticker] = { status: 'live', ...r.value }
    } else {
      map[ticker] = { status: 'error', ticker, error: r.reason?.message || 'ERROR' }
    }
  })
  return map
}
