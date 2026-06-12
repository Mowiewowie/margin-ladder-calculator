import Stat from './Stat.jsx'
import Field from './Field.jsx'
import { PRICE_REFRESH_LABEL } from '../lib/constants.js'
import {
  formatCurrency,
  formatPercent,
  formatSignedCurrency,
} from '../lib/format.js'

const LADDER_ALERT = {
  call: { tone: 'bad', value: 'Margin call' },
  thin: { tone: 'warn', value: 'Thin cushion' },
  clear: { tone: 'good', value: 'All clear' },
}

/**
 * Account-wide summary for the pooled, cross-collateralized account: one shared
 * loan, aggregated equity and the account-level margin-call picture.
 */
export default function AccountSummary({ summary, loan, onLoanChange, prices }) {
  const plTone = summary.unrealizedPL > 0 ? 'good' : summary.unrealizedPL < 0 ? 'bad' : 'default'
  const equityTone = summary.called ? 'bad' : 'good'
  const excessTone = summary.excessEquity < 0 ? 'bad' : 'good'
  const alert = LADDER_ALERT[summary.ladderAlert] ?? LADDER_ALERT.clear

  return (
    <section className="panel">
      <div className="panel__header">
        <h2 className="panel__title">Account Summary</h2>
        <RefreshStatus prices={prices} />
      </div>

      <div className="summary">
        <section className="summary__section">
          <h3 className="summary__heading">Value &amp; Loan</h3>
          <div className="stats-row">
            <Stat label="Total Market Value" term="marketValue" value={formatCurrency(summary.lmv)} />
            <Stat
              label="Margin Loan (auto)"
              term="sharedLoan"
              value={formatCurrency(summary.loan)}
              tone={summary.loan > 0 ? 'warn' : 'default'}
            />
            <Stat label="Buying Power" term="buyingPower" value={formatCurrency(summary.buyingPower)} />
            <Field
              label="Existing Loan (optional)"
              term="existingLoan"
              prefix="$"
              value={loan}
              onChange={onLoanChange}
              hint="Debt you already owe (usually $0)."
            />
          </div>
        </section>

        <section className="summary__section">
          <h3 className="summary__heading">Margin-Call Risk</h3>
          <div className="stats-row">
            <Stat label="Any Ladder Call?" term="ladderAlert" value={alert.value} tone={alert.tone} />
            <Stat
              label="Equity"
              term="accountEquity"
              value={formatCurrency(summary.equity)}
              tone={summary.equity < 0 ? 'bad' : 'default'}
            />
            <Stat label="Equity %" term="equityPct" value={formatPercent(summary.equityPct)} tone={equityTone} />
            <Stat label="Maintenance Req." term="maintenanceRequirement" value={formatCurrency(summary.maintenanceReq)} />
            <Stat
              label="Excess Equity"
              term="excessEquity"
              value={formatSignedCurrency(summary.excessEquity)}
              tone={excessTone}
            />
          </div>
        </section>

        <section className="summary__section">
          <h3 className="summary__heading">Performance</h3>
          <div className="stats-row">
            <Stat label="Total Invested" term="totalInvested" value={formatCurrency(summary.totalInvested)} />
            <Stat
              label="Unrealized P&L"
              term="unrealizedPL"
              value={formatSignedCurrency(summary.unrealizedPL)}
              tone={plTone}
            />
          </div>
        </section>
      </div>

      {summary.called && (
        <p className="alert alert--bad">
          ⚠ Your account is below its maintenance requirement at current prices —
          this is a margin call. Reduce borrowing or add equity.
        </p>
      )}
    </section>
  )
}

function RefreshStatus({ prices }) {
  if (!prices) return null
  const { lastUpdated, loading, refresh, marketOpen } = prices
  const time = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null
  const status = loading
    ? 'Updating…'
    : marketOpen === false
      ? `Market closed — prices paused${time ? ` (as of ${time})` : ''}`
      : time
        ? `Prices updated ${time}`
        : 'Manual prices'
  return (
    <div className="refresh">
      <span className="refresh__text">{status}</span>
      <button
        type="button"
        className="btn btn--ghost"
        onClick={refresh}
        title={
          marketOpen === false
            ? 'Market closed — auto-refresh is paused. Click to fetch now.'
            : `Auto-refreshes every ${PRICE_REFRESH_LABEL} during market hours`
        }
      >
        ↻ Refresh
      </button>
    </div>
  )
}
