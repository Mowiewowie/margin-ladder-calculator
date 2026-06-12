import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchQuotes } from './priceService.js'
import { isMarketOpen as defaultIsMarketOpen } from './marketHours.js'
import { PRICE_DEBOUNCE_MS, PRICE_REFRESH_MS } from './constants.js'

/**
 * Poll live quotes for a set of tickers on an interval (default 30s).
 *
 * Ticker changes are debounced (default 300ms) so typing "AAPL" doesn't fire a
 * fetch for "A", "AA", "AAP", "AAPL" — only the settled value is fetched. A
 * ticker present at mount fetches immediately (no debounce on first load).
 *
 * Interval polling only runs during market hours. After hours the price is
 * fetched once on initial load / when a ticker is added, then left alone.
 * Manual refresh() always fetches regardless of hours.
 *
 * Returns { quotes, lastUpdated, loading, refresh, marketOpen }.
 */
export function usePrices(tickers, options = {}) {
  const {
    provider,
    intervalMs = PRICE_REFRESH_MS,
    debounceMs = PRICE_DEBOUNCE_MS,
    enabled = true,
    isMarketOpen = defaultIsMarketOpen,
  } = options

  const [quotes, setQuotes] = useState({})
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loading, setLoading] = useState(false)

  // Stable, order-independent key for the ticker set.
  const tickerKey = [...new Set((tickers || []).map((t) => String(t || '').trim().toUpperCase()).filter(Boolean))]
    .sort()
    .join(',')

  // Always-current key so manual refresh uses the latest tickers immediately.
  const keyRef = useRef(tickerKey)
  keyRef.current = tickerKey

  // Keep the market-hours check in a ref so changing its identity doesn't
  // re-run the polling effect.
  const isOpenRef = useRef(isMarketOpen)
  isOpenRef.current = isMarketOpen

  // Debounced key drives auto-fetch/polling: it catches up to `tickerKey` only
  // after the user stops changing it for `debounceMs`.
  const [debouncedKey, setDebouncedKey] = useState(tickerKey)
  useEffect(() => {
    const id = setTimeout(() => setDebouncedKey(tickerKey), debounceMs)
    return () => clearTimeout(id)
  }, [tickerKey, debounceMs])

  const refresh = useCallback(async () => {
    const list = keyRef.current ? keyRef.current.split(',') : []
    if (!enabled || list.length === 0) return
    setLoading(true)
    try {
      const next = await fetchQuotes(list, provider)
      setQuotes((prev) => ({ ...prev, ...next }))
      setLastUpdated(Date.now())
    } finally {
      setLoading(false)
    }
  }, [enabled, provider])

  useEffect(() => {
    if (!enabled || !debouncedKey) return undefined
    refresh() // initial fetch (also covers a newly added ticker)
    const id = setInterval(() => {
      if (isOpenRef.current()) refresh() // only auto-poll during market hours
    }, intervalMs)
    return () => clearInterval(id)
  }, [refresh, enabled, debouncedKey, intervalMs])

  return { quotes, lastUpdated, loading, refresh, marketOpen: isMarketOpen() }
}
