// Account-level (cross-collateralized) margin math — the industry-standard
// Reg T model where ALL positions share ONE margin loan and the margin call is
// evaluated for the whole account:
//
//   Long Market Value   LMV  = Σ leg market values
//   Equity              E    = LMV − loan          (one shared loan)
//   Maintenance req $   MR   = Σ leg market value × m   (per-stock m)
//   Excess equity            = E − MR              (house surplus; < 0 ⇒ call)
//   Margin call when E < MR
//
// "Planned / conservative" model: the loan is auto-derived as everything you
// borrow in your ladders (plus an optional existing balance), and planned ladder
// shares are valued at their BUY price. So buying k shares at price p on margin
// adds k·p of market value AND k·p of loan (net equity 0) while adding k·p·m to
// the maintenance requirement — i.e. every margin buy spends excess equity. That
// is exactly "how much can I buy before a call".
//
// A position expands into one collateral "leg" { mv, m } whose market value is
// current shares × current price PLUS each ladder rung's shares × that rung's
// (buy) price. Positions without rungs collapse to current shares × price, so
// the primitives remain backward-compatible.

import { toNumber } from './margin.js'
import { REG_T_INITIAL_MARGIN } from './constants.js'

/**
 * How far a price can fall before reaching `callPrice`, as a fraction of price
 * (0.25 = 25% cushion). Shared by the ladder math and the per-stock bar.
 */
export function cushionFraction(price, callPrice) {
  const p = toNumber(price)
  if (!(p > 0)) return 0
  return (p - toNumber(callPrice)) / p
}

/**
 * Expand a position into its planned collateral leg.
 * @returns {{ mv, m, rungCost, totalShares, currentShares, currentPrice, currentMv }}
 */
export function positionLeg(p) {
  const currentShares = toNumber(p.shares)
  const currentPrice = toNumber(p.price)
  const m = toNumber(p.eprPct) / 100
  let mv = currentShares * currentPrice
  let rungCost = 0
  let rungShares = 0
  for (const r of p.rungs ?? []) {
    const rp = toNumber(r.price)
    const rs = toNumber(r.shares)
    mv += rs * rp
    rungCost += rs * rp
    rungShares += rs
  }
  return {
    mv,
    m,
    rungCost,
    totalShares: currentShares + rungShares,
    currentShares,
    currentPrice,
    currentMv: currentShares * currentPrice,
  }
}

/** Aggregate snapshot over a list of collateral legs { mv, m } and a loan. */
export function snapshotLegs(legs, loan, opts = {}) {
  const initialMargin = opts.initialMargin ?? REG_T_INITIAL_MARGIN
  const L = toNumber(loan)

  let lmv = 0
  let maintenanceReq = 0
  for (const leg of legs) {
    lmv += leg.mv
    maintenanceReq += leg.mv * leg.m
  }

  const eq = lmv - L
  const equityPct = lmv > 0 ? eq / lmv : NaN
  const maintenancePct = lmv > 0 ? maintenanceReq / lmv : NaN
  const excessEquity = eq - maintenanceReq
  const called = lmv > 0 ? eq < maintenanceReq : false

  let buyingPower = 0
  if (initialMargin > 0 && eq > 0) {
    const bp = eq / initialMargin - lmv
    buyingPower = bp > 0 ? bp : 0
  }

  return { lmv, loan: L, equity: eq, equityPct, maintenanceReq, maintenancePct, excessEquity, called, buyingPower }
}

/** Snapshot of the whole account at a shared loan (positions may include rungs). */
export function accountSnapshot(positions, loan, opts = {}) {
  return snapshotLegs(positions.map(positionLeg), loan, opts)
}

/**
 * The uniform price position[index]'s shares would fall to before the ACCOUNT
 * hits maintenance, holding other positions fixed as collateral.
 *
 *   p_j = [ L − Σ_{i≠j} mv_i·(1 − m_i) ] / [ S_j·(1 − m_j) ]
 *
 * S_j is the position's TOTAL shares (current + planned). Clamped at 0 when the
 * other positions already cover the loan. Reduces to L / (S·(1 − m)) for a
 * single position with no rungs.
 */
export function symbolCallPrice(positions, loan, index) {
  const legs = positions.map(positionLeg)
  const focus = legs[index]
  if (!focus || focus.totalShares <= 0) return 0
  const denom = focus.totalShares * (1 - focus.m)
  if (denom <= 0) return Infinity

  let otherCollateral = 0
  legs.forEach((leg, i) => {
    if (i !== index) otherCollateral += leg.mv * (1 - leg.m)
  })

  const p = (toNumber(loan) - otherCollateral) / denom
  return p > 0 ? p : 0
}

/**
 * Max additional shares of position[index] you can buy at `atPrice`, funded on
 * margin, before the account hits maintenance. k = excessEquity / (atPrice × m),
 * with the focus position re-priced at `atPrice`.
 */
export function maxSharesBeforeCallAccount(positions, loan, index, atPrice, opts = {}) {
  const p = toNumber(atPrice)
  const mj = positionLeg(positions[index]).m
  if (p <= 0) return 0
  if (mj <= 0) return Infinity
  const repriced = positions.map((pos, i) => (i === index ? { ...pos, price: p } : pos))
  const { excessEquity } = accountSnapshot(repriced, loan, opts)
  const k = excessEquity / (p * mj)
  return k > 0 ? k : 0
}

/**
 * Simulate building out one position's ladder, rung by rung, on top of the rest
 * of the account (other positions counted as their full planned legs). Loan and
 * shares accumulate; each margin buy is valued conservatively at its buy price.
 *
 * @param {object} args
 *   position : focus position { shares, avgCost, eprPct, price, rungs }
 *   others   : the other raw positions (their full plans act as collateral)
 *   loan     : the account's existing (pre-ladder) loan balance
 * @returns {Array} cumulative rows evaluated at the account level.
 */
export function computePositionLadder({ position, others = [], loan = 0, opts = {} }) {
  const m = toNumber(position.eprPct) / 100
  const currentShares = toNumber(position.shares)
  const currentPrice = toNumber(position.price)

  const otherLegs = others.map(positionLeg).map((l) => ({ mv: l.mv, m: l.m, rungCost: l.rungCost }))
  const otherCollateral = otherLegs.reduce((a, l) => a + l.mv * (1 - l.m), 0)
  const otherRungCost = otherLegs.reduce((a, l) => a + l.rungCost, 0)
  const baseLoan = toNumber(loan) + otherRungCost

  const ordered = [...(position.rungs ?? [])].sort((a, b) => toNumber(b.price) - toNumber(a.price))

  let focusMv = currentShares * currentPrice
  let focusShares = currentShares
  let curLoan = baseLoan

  return ordered.map((rung) => {
    const price = toNumber(rung.price)
    const buyShares = toNumber(rung.shares)
    const cost = buyShares * price

    // Max shares before a call, from the PRE-buy state at this rung's price.
    const preLegs = [...otherLegs, { mv: focusMv, m }]
    const pre = snapshotLegs(preLegs, curLoan, opts)
    const maxShares = m > 0 && price > 0 ? Math.max(0, pre.excessEquity / (price * m)) : m <= 0 ? Infinity : 0

    // Apply the conservative margin buy.
    focusMv += cost
    focusShares += buyShares
    curLoan += cost

    const snap = snapshotLegs([...otherLegs, { mv: focusMv, m }], curLoan, opts)

    // Focus call price: uniform price all focus shares would fall to for a call.
    let callPrice
    const denom = focusShares * (1 - m)
    if (focusShares <= 0) callPrice = 0
    else if (denom <= 0) callPrice = Infinity
    else {
      const pp = (curLoan - otherCollateral) / denom
      callPrice = pp > 0 ? pp : 0
    }

    return {
      id: rung.id,
      price,
      buyShares,
      buyCost: cost,
      maxSharesBeforeCall: maxShares,
      cumulativeShares: focusShares,
      cumulativeLoan: curLoan,
      equityPct: snap.equityPct,
      excessEquity: snap.excessEquity,
      callPrice,
      called: snap.called,
      cushionPct: cushionFraction(currentPrice, callPrice),
    }
  })
}

/**
 * Compute the full account model in the planned/conservative sense: loan =
 * existing balance + every ladder buy across all positions; everything valued
 * with planned shares at their buy price. Returns the aggregate summary plus a
 * per-position view (planned figures, account-aware call price, ladder rows).
 */
export function computeAccount(account, opts = {}) {
  const positions = account.positions ?? []
  const existingLoan = toNumber(account.loan)
  const legs = positions.map(positionLeg)
  const plannedBuyCost = legs.reduce((a, l) => a + l.rungCost, 0)
  const plannedLoan = existingLoan + plannedBuyCost

  const snap = snapshotLegs(legs.map((l) => ({ mv: l.mv, m: l.m })), plannedLoan, opts)

  const totalInvested = positions.reduce((acc, p) => {
    const base = toNumber(p.shares) * toNumber(p.avgCost)
    const rc = (p.rungs ?? []).reduce((a, r) => a + toNumber(r.shares) * toNumber(r.price), 0)
    return acc + base + rc
  }, 0)
  const unrealizedPL = snap.lmv - totalInvested

  const positionViews = positions.map((p, i) => {
    const others = positions.filter((_, j) => j !== i)
    const leg = legs[i]
    const costBasis = toNumber(p.shares) * toNumber(p.avgCost) + leg.rungCost
    return {
      ...p,
      shares: toNumber(p.shares),
      marketValue: leg.mv,
      currentMarketValue: leg.currentMv,
      plannedBuyCost: leg.rungCost,
      costBasis,
      unrealizedPL: leg.mv - costBasis,
      weightPct: snap.lmv > 0 ? leg.mv / snap.lmv : 0,
      callPrice: symbolCallPrice(positions, plannedLoan, i),
      ladderRows: computePositionLadder({ position: p, others, loan: existingLoan, opts }),
    }
  })

  return {
    summary: { ...snap, totalInvested, unrealizedPL, existingLoan, plannedBuyCost },
    positions: positionViews,
  }
}
