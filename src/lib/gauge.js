// Shared positioning helpers for the margin gauges (account bar + per-stock
// mini bar), so the bar math lives in one place.

/** Clamp a percentage to the visible 0–100 range (NaN -> 0). */
export function clampPct(value) {
  if (Number.isNaN(value)) return 0
  return Math.min(100, Math.max(0, value))
}

/** Map a value within [0, max] to a clamped percentage (for bar offsets). */
export function toPctOfMax(value, max) {
  if (!(max > 0)) return 0
  return clampPct((value / max) * 100)
}
