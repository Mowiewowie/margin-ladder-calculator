// Pure helpers for generating ladder rung prices, shared by the account hook's
// "Add rung" and "Fill N% steps" actions (so the stepping math lives in one
// tested place).

import { DEFAULT_LADDER_STEP_PCT } from './constants.js'
import { toNumber } from './margin.js'

/** Round a price to cents. */
export function round2(n) {
  return Math.round(toNumber(n) * 100) / 100
}

/**
 * Evenly-spaced rung prices descending from `top`, each `stepPct` of `top`
 * apart (default 5%). Stops early at $0. e.g. top=100, 5%, count=3 -> [95,90,85].
 */
export function incrementRungPrices(top, { stepPct = DEFAULT_LADDER_STEP_PCT, count = 5 } = {}) {
  const base = toNumber(top)
  const step = base * stepPct
  const prices = []
  for (let i = 1; i <= count; i++) {
    const price = round2(base - step * i)
    if (price <= 0) break
    prices.push(price)
  }
  return prices
}

/**
 * The next rung price one step below `basis`, where the step is `stepPct` of the
 * reference price `top`. Never negative.
 */
export function nextRungPrice(basis, top, stepPct = DEFAULT_LADDER_STEP_PCT) {
  const step = toNumber(top) * stepPct
  return Math.max(0, round2(toNumber(basis) - step))
}
