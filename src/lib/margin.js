// Core single-position margin primitives — the shared building blocks reused by
// the account-level (cross-collateralized) math in account.js. Pure functions,
// no React.
//
// Notation:
//   S = shares, L = margin loan (debit balance), P = a price
//   m = maintenance requirement (EPR) as a DECIMAL (0.30 for 30%)
//
// Relationships:
//   Market Value  MV = S * P
//   Equity        E  = MV - L
//   Equity %      E% = E / MV
//   Margin call triggers when E% < m
//   Margin call price  P_call = L / (S * (1 - m))

/** Market value of a position at a given price. */
export function marketValue(shares, price) {
  return shares * price
}

/** Equity = market value - loan. Can be negative if underwater. */
export function equity(shares, price, loan) {
  return marketValue(shares, price) - loan
}

/**
 * Equity as a fraction of market value (E / MV). Returns NaN when there is no
 * market value (no shares or zero price) — callers/format layer handle that.
 */
export function equityPct(shares, price, loan) {
  const mv = marketValue(shares, price)
  if (mv <= 0) return NaN
  return equity(shares, price, loan) / mv
}

/** True when the position is in a margin call at this price. */
export function isCalled(shares, price, loan, m) {
  const pct = equityPct(shares, price, loan)
  if (Number.isNaN(pct)) return false
  return pct < m
}

/**
 * Price at which equity% falls exactly to the maintenance requirement — the
 * margin-call price. Below this price you get called.
 *   P_call = L / (S * (1 - m))
 * With no loan there is no call (returns 0). Guards against S = 0 and m >= 1.
 */
export function marginCallPrice(shares, loan, m) {
  if (loan <= 0) return 0
  if (shares <= 0) return Infinity
  const denom = shares * (1 - m)
  if (denom <= 0) return Infinity // m >= 100% can never be satisfied with a loan
  return loan / denom
}

/**
 * Largest number of shares you could buy AT `price`, funded entirely by margin,
 * and still sit exactly at the maintenance requirement (zero further cushion).
 *   k_max = (S * price * (1 - m) - L) / (m * price)
 * Uses the PRE-purchase shares S and loan L. Never returns below 0; returns 0
 * if you're already at/over the limit, and Infinity when m = 0.
 */
export function maxSharesBeforeCall(shares, price, loan, m) {
  if (price <= 0) return 0
  if (m <= 0) return Infinity // no maintenance requirement — unbounded
  const numerator = shares * price * (1 - m) - loan
  const k = numerator / (m * price)
  return k > 0 ? k : 0
}

/**
 * Buying power: additional dollars you could borrow against current equity
 * under a Reg-T-style initial margin requirement `initialMargin` (e.g. 0.5).
 * Informational only. = Equity / initialMargin - MarketValue, floored at 0.
 */
export function buyingPower(shares, price, loan, initialMargin) {
  if (initialMargin <= 0) return Infinity
  const e = equity(shares, price, loan)
  if (e <= 0) return 0
  const bp = e / initialMargin - marketValue(shares, price)
  return bp > 0 ? bp : 0
}

/** Coerce possibly-empty/invalid input values to a finite number (0 fallback). */
export function toNumber(v) {
  const n = typeof v === 'number' ? v : parseFloat(v)
  return Number.isFinite(n) ? n : 0
}
