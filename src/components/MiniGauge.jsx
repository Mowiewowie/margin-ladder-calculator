import { formatCurrency, formatPercent } from '../lib/format.js'
import { cushionFraction } from '../lib/account.js'
import { toPctOfMax } from '../lib/gauge.js'

/**
 * Thin per-stock margin-distance bar shown above a stock's ladder. Shows how far
 * THIS stock can fall (with the rest of the account held at current prices)
 * before the whole account hits a margin call. The call price is account-aware,
 * so it reflects the other stocks as collateral.
 *
 * Prices are labelled inline: the call price (yellow) sits by the call line, the
 * current price (blue) sits by the marker. The cushion stays in the header.
 */
export default function MiniGauge({ price, callPrice, called }) {
  const hasCall = callPrice > 0
  const cushion = hasCall ? cushionFraction(price, callPrice) : 1

  if (!hasCall) {
    return (
      <p className="minigauge__note">
        No margin call for this stock at current borrowing — its account-aware
        call price is $0 (the account isn’t leveraged against it yet).
      </p>
    )
  }

  const max = Math.max(price, callPrice) * 1.15 || 1
  const callPos = toPctOfMax(callPrice, max)
  const nowPos = toPctOfMax(price, max)
  // If the call line is near the left edge there's no room to sit the label to
  // its left, so flip it to the right of the line.
  const callOnLeft = callPos > 22

  return (
    <div className={`minigauge${called ? ' minigauge--called' : ''}`}>
      <div className="minigauge__head">
        <span>
          {called ? (
            <span className="text-bad">margin call</span>
          ) : (
            <>
              <span className="text-good">{formatPercent(cushion)}</span> cushion from today’s price
            </>
          )}
        </span>
      </div>
      <div
        className="minigauge__track"
        role="img"
        aria-label={`This stock can fall ${formatPercent(cushion)} to ${formatCurrency(callPrice)} before an account margin call. Current price ${formatCurrency(price)}.`}
      >
        <div className="minigauge__danger" style={{ width: `${callPos}%` }} />
        <span
          className={`minigauge__price minigauge__price--call${callOnLeft ? '' : ' minigauge__price--flip'}`}
          style={{ left: `${callPos}%` }}
        >
          {formatCurrency(callPrice)}
        </span>
        <div className="minigauge__marker" style={{ left: `${nowPos}%` }} />
        <span className="minigauge__price minigauge__price--now" style={{ left: `${nowPos}%` }}>
          {formatCurrency(price)}
        </span>
      </div>
    </div>
  )
}
