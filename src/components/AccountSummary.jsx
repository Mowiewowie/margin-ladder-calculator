import Stat from './Stat.jsx'
import StatGroup from './StatGroup.jsx'
import Field from './Field.jsx'
import { PRICE_REFRESH_LABEL } from '../lib/constants.js'
import {
  formatCurrency,
  formatPercent,
  formatSignedCurrency,
} from '../lib/format.js'

/**
 * Account-wide summary for the pooled, cross-collateralized account: one shared
 * loan, aggregated equity and the account-level margin-call picture.
 */
export default function AccountSummary({ summary, loan, onLoanChange, prices }) {
  const plTone = summary.unrealizedPL > 0 ? 'good' : summary.unrealizedPL < 0 ? 'bad' : 'default'
  const equityTone = summary.called ? 'bad' : 'good'
  const excessTone = summary.excessEquity < 0 ? 'bad' : 'good'

  return (
    <section className="panel">
      <div className="panel__header">
        <h2 className="panel__title">Account Summary</h2>
        <RefreshStatus prices={prices} />
      </div>

      <div className="account-controls">
        <Field
          label="Existing Loan (optional)"
          term="existingLoan"
          prefix="$"
          value={loan}
          onChange={onLoanChange}
          hint="Debt you ALREADY owe. Usually $0 — your ladders add the rest automatically."
        />
      </div>

      <div className="summary-groups">
        <StatGroup title="Account — Value & Loan">
          <Stat label="Total Market Value" term="marketValue" value={formatCurrency(summary.lmv)} />
          <Stat
            label="Margin Loan (auto)"
            term="sharedLoan"
            value={formatCurrency(summary.loan)}
            tone={summary.loan > 0 ? 'warn' : 'default'}
          />
          <Stat label="↳ Borrowed via ladders" term="sharedLoan" value={formatCurrency(summary.plannedBuyCost)} />
          <Stat label="Buying Power" term="buyingPower" value={formatCurrency(summary.buyingPower)} />
        </StatGroup>

        <StatGroup title="Account — Margin-Call Risk">
          <Stat
            label="Equity"
            term="accountEquity"
            value={formatCurrency(summary.equity)}
            tone={summary.equity < 0 ? 'bad' : 'default'}
          />
          <Stat label="Equity %" term="equityPct" value={formatPercent(summary.equityPct)} tone={equityTone} />
          <Stat
            label="Maintenance Req."
            term="maintenanceRequirement"
            value={formatCurrency(summary.maintenanceReq)}
          />
          <Stat
            label="Excess Equity"
            term="excessEquity"
            value={formatSignedCurrency(summary.excessEquity)}
            tone={excessTone}
            big
          />
        </StatGroup>

        <StatGroup title="Performance">
          <Stat label="Total Invested" term="totalInvested" value={formatCurrency(summary.totalInvested)} />
          <Stat
            label="Unrealized P&L"
            term="unrealizedPL"
            value={formatSignedCurrency(summary.unrealizedPL)}
            tone={plTone}
          />
        </StatGroup>
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
  const { lastUpdated, loading, refresh } = prices
  const time = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null
  return (
    <div className="refresh">
      <span className="refresh__text">
        {loading ? 'Updating…' : time ? `Prices updated ${time}` : 'Manual prices'}
      </span>
      <button type="button" className="btn btn--ghost" onClick={refresh} title={`Auto-refreshes every ${PRICE_REFRESH_LABEL}`}>
        ↻ Refresh
      </button>
    </div>
  )
}
