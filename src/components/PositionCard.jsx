import Field from './Field.jsx'
import Stat from './Stat.jsx'
import TickerField from './TickerField.jsx'
import LadderTable from './LadderTable.jsx'
import MiniGauge from './MiniGauge.jsx'
import {
  formatCurrency,
  formatPercent,
  formatShares,
  formatSignedCurrency,
} from '../lib/format.js'

/**
 * One stock in the account: ticker + live price, its inputs, derived stats, and
 * its own account-aware buy ladder.
 *
 * `position` is the RAW account entry (inputs bind to it, so empty fields stay
 * blank). `view` is the computed model view (stats + ladder rows).
 */
export default function PositionCard({
  position,
  view,
  onUpdatePosition,
  onRemovePosition,
  ladder,
}) {
  const pid = position.id
  const set = (key) => (value) => onUpdatePosition(pid, key, value)
  const plTone = view.unrealizedPL > 0 ? 'good' : view.unrealizedPL < 0 ? 'bad' : 'default'
  // This stock is in a call when its price has fallen below its account-aware
  // call price (others held at current prices).
  const stockCalled = view.callPrice > 0 && view.price < view.callPrice

  return (
    <section className="panel position">
      <div className="position__top">
        <TickerField
          position={view}
          onTickerChange={set('ticker')}
          onManualPriceChange={set('manualPrice')}
        />
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => onRemovePosition(pid)}
        >
          Remove stock
        </button>
      </div>

      <div className="inputs-grid">
        <Field
          label="Shares Owned"
          term="sharesOwned"
          value={position.shares}
          onChange={set('shares')}
        />
        <Field
          label="Average Cost Basis"
          term="avgCost"
          prefix="$"
          value={position.avgCost}
          onChange={set('avgCost')}
        />
        <Field
          label="EPR % (Maintenance)"
          term="eprPct"
          suffix="%"
          value={position.eprPct}
          onChange={set('eprPct')}
          hint="This stock’s maintenance rate."
        />
        {/* Only show the manual price when there's no live quote to use. */}
        {view.priceStatus !== 'live' && (
          <Field
            label="Price"
            term="manualPrice"
            prefix="$"
            value={position.manualPrice}
            onChange={set('manualPrice')}
            hint={view.priceStatus === 'pending' ? 'Used until a live quote arrives.' : 'No live quote — type the price.'}
          />
        )}
      </div>

      <div className="stats-grid position__stats">
        <Stat label="Market Value" term="marketValue" value={formatCurrency(view.marketValue)} />
        <Stat label="Account Weight" value={formatPercent(view.weightPct)} />
        <Stat
          label="Unrealized P&L"
          term="unrealizedPL"
          value={formatSignedCurrency(view.unrealizedPL)}
          tone={plTone}
        />
        <Stat
          label="Margin Call Price"
          term="symbolCallPrice"
          value={view.callPrice > 0 ? formatCurrency(view.callPrice) : 'None'}
          tone={stockCalled ? 'bad' : view.callPrice > 0 ? 'warn' : 'good'}
        />
      </div>

      <MiniGauge price={view.price} callPrice={view.callPrice} called={stockCalled} />

      <LadderTable
        rungs={position.rungs ?? []}
        rows={view.ladderRows}
        onUpdateRung={(rungId, key, value) => ladder.onUpdateRung(pid, rungId, key, value)}
        onAddRung={() => ladder.onAddRung(pid)}
        onRemoveRung={(rungId) => ladder.onRemoveRung(pid, rungId)}
        onFillIncrements={(opts) => ladder.onFillIncrements(pid, opts)}
        onClear={() => ladder.onClear(pid)}
      />
    </section>
  )
}
