import { formatCurrency, formatPercent } from '../lib/format.js'
import { clampPct } from '../lib/gauge.js'

/**
 * Account risk gauge: account equity % against the blended maintenance
 * requirement. The red zone (below the maintenance %) is a margin call; the
 * marker is where the account sits now. Reads the account summary from account.js.
 */
export default function MarginGauge({ summary }) {
  const equityPct = Number.isFinite(summary.equityPct) ? summary.equityPct : null
  const maintPct = Number.isFinite(summary.maintenancePct) ? summary.maintenancePct : 0

  if (equityPct == null) {
    return (
      <section className="panel gauge-panel">
        <h2 className="panel__title">Account Risk</h2>
        <p className="gauge__readout">Add a stock with shares and a price to see your risk.</p>
      </section>
    )
  }

  // Scale 0–100% of market value.
  const pct = (v) => `${clampPct(v * 100)}%`

  return (
    <section className="panel gauge-panel">
      <h2 className="panel__title">Account Risk — equity vs. maintenance</h2>
      <p className="gauge__sub">Where your whole account stands at today’s prices.</p>

      <div
        className="gauge"
        role="img"
        aria-label={`Account equity ${formatPercent(equityPct)} versus maintenance requirement ${formatPercent(maintPct)}.`}
      >
        <div className="gauge__track">
          <div className="gauge__danger" style={{ width: pct(maintPct) }} />
          <div className="gauge__marker gauge__marker--call" style={{ left: pct(maintPct) }}>
            <span className="gauge__flag gauge__flag--call">Maint. {formatPercent(maintPct)}</span>
          </div>
          <div className="gauge__marker gauge__marker--now" style={{ left: pct(equityPct) }}>
            <span className="gauge__flag gauge__flag--now">Equity {formatPercent(equityPct)}</span>
          </div>
        </div>
        <div className="gauge__scale">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      <p className="gauge__readout">
        {summary.called ? (
          <span className="text-bad">
            Account equity is below the maintenance requirement — margin call.
          </span>
        ) : (
          <>
            Cushion before a call:{' '}
            <strong className="text-good">{formatCurrency(summary.excessEquity)}</strong> of
            excess equity ({formatPercent(equityPct - maintPct)} of market value).
          </>
        )}
      </p>
    </section>
  )
}
