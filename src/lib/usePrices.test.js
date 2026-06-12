import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import { usePrices } from './usePrices.js'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('usePrices — debounced ticker fetching', () => {
  it('coalesces rapid ticker edits into a single fetch of the settled value', async () => {
    vi.useFakeTimers()
    const provider = vi.fn(async (t) => ({ ticker: t, price: 100 }))

    const { rerender } = renderHook(
      ({ tk }) => usePrices(tk, { provider, debounceMs: 300, intervalMs: 1_000_000 }),
      { initialProps: { tk: [] } }
    )

    // Simulate typing A -> AA -> AAP -> AAPL inside the debounce window.
    rerender({ tk: ['A'] })
    rerender({ tk: ['AA'] })
    rerender({ tk: ['AAP'] })
    rerender({ tk: ['AAPL'] })

    expect(provider).not.toHaveBeenCalled() // nothing while "typing"

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(provider).toHaveBeenCalledTimes(1)
    expect(provider).toHaveBeenCalledWith('AAPL')
  })

  it('does not fetch when there are no tickers', async () => {
    vi.useFakeTimers()
    const provider = vi.fn()
    renderHook(() => usePrices([], { provider, debounceMs: 300 }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(provider).not.toHaveBeenCalled()
  })
})

describe('usePrices — market-hours polling', () => {
  it('after hours: fetches once on load but does NOT poll on the interval', async () => {
    vi.useFakeTimers()
    const provider = vi.fn(async (t) => ({ ticker: t, price: 100 }))
    renderHook(() =>
      usePrices(['AAPL'], { provider, debounceMs: 0, intervalMs: 1000, isMarketOpen: () => false })
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(provider).toHaveBeenCalledTimes(1) // initial load only

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000) // several intervals elapse
    })
    expect(provider).toHaveBeenCalledTimes(1) // still 1 — no after-hours polling
  })

  it('during market hours: polls on the interval', async () => {
    vi.useFakeTimers()
    const provider = vi.fn(async (t) => ({ ticker: t, price: 100 }))
    renderHook(() =>
      usePrices(['AAPL'], { provider, debounceMs: 0, intervalMs: 1000, isMarketOpen: () => true })
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(provider).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(provider).toHaveBeenCalledTimes(2)
  })
})
