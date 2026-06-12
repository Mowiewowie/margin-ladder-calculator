// Shared constants — no magic numbers scattered across components.

// Reg T initial margin requirement (50%) used only for informational
// "buying power" display. The margin-call math uses the maintenance
// requirement (EPR%) that the user enters per stock.
export const REG_T_INITIAL_MARGIN = 0.5

// EPR% (maintenance requirement) input bounds, as percentages (0–100).
export const EPR_MIN_PCT = 0
export const EPR_MAX_PCT = 100

// Ladder "fill" helper uses a PERCENTAGE step so it scales with price.
export const DEFAULT_LADDER_STEP_PCT = 0.05
export const DEFAULT_LADDER_STEP_LABEL = '5%'

// Cushion (%) below which a rung is flagged "amber" — getting close to a call
// even though it hasn't triggered yet. Expressed as a fraction of price.
export const THIN_CUSHION_PCT = 0.1

// Live price polling cadence and data source label (shown in the footnote).
export const PRICE_REFRESH_MS = 30000
export const PRICE_REFRESH_LABEL = '30 seconds'
export const PRICE_DATA_SOURCE = 'Finnhub'

// Debounce ticker edits so we don't fetch on every keystroke while typing.
// ~300ms is the type-ahead sweet spot: skips intermediate fetches but still
// feels instant once you stop typing.
export const PRICE_DEBOUNCE_MS = 300

// localStorage key for the saved account (bump the version if the shape changes).
export const ACCOUNT_STORAGE_KEY = 'margin-ladder-calculator:account:v1'

let seq = 0
const uid = (prefix) => `${prefix}${Date.now().toString(36)}${(seq++).toString(36)}`

/** Factory for a fresh, empty position (used by "Add stock"). */
export function makePosition(overrides = {}) {
  return {
    id: uid('p'),
    ticker: '',
    shares: '',
    avgCost: '',
    eprPct: 30,
    manualPrice: '', // fallback / used when no live quote
    rungs: [],
    ...overrides,
  }
}

/** Factory for a fresh ladder rung. */
export function makeRung(overrides = {}) {
  return { id: uid('r'), price: '', shares: '', ...overrides }
}

// Default account, matching the original worked example as the first position so
// the app is immediately illustrative offline (no ticker => uses manual price).
export const DEFAULT_ACCOUNT = {
  loan: 0,
  positions: [
    {
      id: 'p-demo',
      ticker: '',
      shares: 1000,
      avgCost: 100,
      eprPct: 30,
      manualPrice: 100,
      rungs: [
        { id: 'r1', price: 90, shares: 500 },
        { id: 'r2', price: 80, shares: 500 },
        { id: 'r3', price: 70, shares: 500 },
      ],
    },
  ],
}
