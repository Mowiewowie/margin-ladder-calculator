import { useMemo, useState } from 'react'
import { computeAccount } from './account.js'
import { usePrices } from './usePrices.js'
import { toNumber } from './margin.js'
import {
  DEFAULT_ACCOUNT,
  DEFAULT_LADDER_STEP_PCT,
  REG_T_INITIAL_MARGIN,
  makePosition,
  makeRung,
} from './constants.js'

/** Round a price to cents. */
const round2 = (n) => Math.round(n * 100) / 100

/**
 * Single state + recompute hook for the whole multi-stock account.
 *
 * Owns positions (each with its own ladder) and the shared loan, polls live
 * prices for any tickers, resolves each position's effective price (live quote
 * when available, else the manual price), and computes the account model.
 * Components stay presentational.
 */
export function useAccountModel() {
  const [account, setAccount] = useState(DEFAULT_ACCOUNT)

  const tickers = account.positions.map((p) => p.ticker).filter(Boolean)
  const { quotes, lastUpdated, loading, refresh } = usePrices(tickers)

  // Resolve each position's effective price + a status for the UI.
  const resolved = useMemo(() => {
    return account.positions.map((p) => {
      const sym = String(p.ticker || '').trim().toUpperCase()
      const quote = sym ? quotes[sym] : null
      const live = quote && quote.status === 'live'
      return {
        ...p,
        price: live ? quote.price : toNumber(p.manualPrice),
        priceStatus: !sym
          ? 'manual'
          : live
            ? 'live'
            : quote?.status === 'error'
              ? 'error'
              : 'pending',
        quote: quote || null,
      }
    })
  }, [account.positions, quotes])

  const model = useMemo(
    () => computeAccount({ loan: account.loan, positions: resolved }, { initialMargin: REG_T_INITIAL_MARGIN }),
    [account.loan, resolved]
  )

  // --- account-level mutators ---
  const setLoan = (value) => setAccount((a) => ({ ...a, loan: value }))

  const addPosition = () =>
    setAccount((a) => ({ ...a, positions: [...a.positions, makePosition()] }))

  const removePosition = (id) =>
    setAccount((a) => ({ ...a, positions: a.positions.filter((p) => p.id !== id) }))

  const updatePosition = (id, key, value) =>
    setAccount((a) => ({
      ...a,
      positions: a.positions.map((p) => (p.id === id ? { ...p, [key]: value } : p)),
    }))

  // --- per-position ladder mutators ---
  const mutateRungs = (positionId, fn) =>
    setAccount((a) => ({
      ...a,
      positions: a.positions.map((p) =>
        p.id === positionId ? { ...p, rungs: fn(p.rungs ?? [], p) } : p
      ),
    }))

  const updateRung = (positionId, rungId, key, value) =>
    mutateRungs(positionId, (rungs) =>
      rungs.map((r) => (r.id === rungId ? { ...r, [key]: value } : r))
    )

  const addRung = (positionId) =>
    mutateRungs(positionId, (rungs, pos) => {
      const ref = priceOf(model, positionId) || toNumber(pos.manualPrice)
      const basis = rungs.length
        ? Math.min(...rungs.map((r) => toNumber(r.price)))
        : ref
      const step = ref * DEFAULT_LADDER_STEP_PCT // 5% of the current price
      const price = Math.max(0, round2(basis - step))
      const lastShares = rungs.length ? rungs[rungs.length - 1].shares : 100
      return [...rungs, makeRung({ price, shares: lastShares })]
    })

  const removeRung = (positionId, rungId) =>
    mutateRungs(positionId, (rungs) => rungs.filter((r) => r.id !== rungId))

  const clearRungs = (positionId) => mutateRungs(positionId, () => [])

  const fillIncrements = (positionId, { stepPct = DEFAULT_LADDER_STEP_PCT, count = 5, sharesPer = 200 } = {}) =>
    mutateRungs(positionId, (_rungs, pos) => {
      const top = priceOf(model, positionId) || toNumber(pos.manualPrice)
      const step = top * stepPct // each rung is `stepPct` of the current price lower
      const generated = []
      for (let i = 1; i <= count; i++) {
        const price = round2(top - step * i)
        if (price <= 0) break
        generated.push(makeRung({ price, shares: sharesPer }))
      }
      return generated
    })

  return {
    account,
    model,
    prices: { quotes, lastUpdated, loading, refresh },
    setLoan,
    addPosition,
    removePosition,
    updatePosition,
    updateRung,
    addRung,
    removeRung,
    clearRungs,
    fillIncrements,
  }
}

/** Find a position's resolved current price from the computed model. */
function priceOf(model, positionId) {
  const view = model.positions.find((p) => p.id === positionId)
  return view ? toNumber(view.price) : 0
}
