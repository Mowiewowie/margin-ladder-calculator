// Shared number formatters — presentation defined once, used everywhere.

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const sharesFmt = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

/** "$1,234.56". Non-finite values render as an em dash. */
export function formatCurrency(value) {
  if (!Number.isFinite(value)) return '—'
  return currencyFmt.format(value)
}

/** Like formatCurrency but always shows an explicit + / − sign. */
export function formatSignedCurrency(value) {
  if (!Number.isFinite(value)) return '—'
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return sign + currencyFmt.format(Math.abs(value))
}

/**
 * Format a fraction (0.667) as a percent string ("66.7%").
 * @param {number} fraction  value where 1 = 100%.
 * @param {number} [digits]  decimal places (default 1).
 */
export function formatPercent(fraction, digits = 1) {
  if (!Number.isFinite(fraction)) return '—'
  return `${(fraction * 100).toFixed(digits)}%`
}

/** Whole-share count with thousands separators. */
export function formatShares(value) {
  if (!Number.isFinite(value)) return '—'
  return sharesFmt.format(value)
}
