import { useId } from 'react'
import InfoTooltip from './InfoTooltip.jsx'
import { formatCurrency } from '../lib/format.js'

/**
 * Ticker symbol input plus a live-price readout/status badge.
 *
 * Status (from the resolved position):
 *   live    — green price + change, pulled from the provider
 *   pending — fetching / waiting for the first quote
 *   error   — fetch failed (bad symbol, no key, market data issue): manual used
 *   manual  — no ticker entered: manual price used
 */
export default function TickerField({ position, onTickerChange, onManualPriceChange }) {
  const id = useId()
  const { priceStatus, quote } = position

  return (
    <div className="ticker">
      <label className="field__label" htmlFor={id}>
        Stock Ticker
        <InfoTooltip term="ticker" label="ticker" />
      </label>
      <div className="ticker__row">
        <input
          id={id}
          className="ticker__input"
          type="text"
          placeholder="e.g. AAPL"
          autoCapitalize="characters"
          spellCheck={false}
          value={position.ticker}
          onChange={(e) => onTickerChange(e.target.value.toUpperCase())}
        />
        <PriceBadge status={priceStatus} quote={quote} />
      </div>
      {priceStatus === 'error' && (
        <p className="field__hint field__hint--warn">
          Couldn’t fetch a live quote — using your manual price below.
        </p>
      )}
    </div>
  )
}

function PriceBadge({ status, quote }) {
  if (status === 'live') {
    const chg = typeof quote.changePct === 'number' ? quote.changePct : null
    const up = (chg ?? 0) >= 0
    return (
      <span className="price-badge price-badge--live">
        <span className="dot" /> {formatCurrency(quote.price)}
        {chg != null && (
          <span className={up ? 'text-good' : 'text-bad'}>
            {' '}
            {up ? '▲' : '▼'} {Math.abs(chg).toFixed(2)}%
          </span>
        )}
      </span>
    )
  }
  if (status === 'pending') {
    return <span className="price-badge price-badge--pending">fetching…</span>
  }
  if (status === 'error') {
    return <span className="price-badge price-badge--error">quote unavailable</span>
  }
  return <span className="price-badge price-badge--manual">manual price</span>
}
