import { useAccountModel } from './lib/useAccountModel.js'
import AccountSummary from './components/AccountSummary.jsx'
import MarginGauge from './components/MarginGauge.jsx'
import PositionCard from './components/PositionCard.jsx'
import { hasApiKey } from './lib/priceService.js'
import { PRICE_DATA_SOURCE, PRICE_REFRESH_LABEL } from './lib/constants.js'

export default function App() {
  const {
    account,
    model,
    prices,
    setLoan,
    addPosition,
    removePosition,
    updatePosition,
    updateRung,
    addRung,
    removeRung,
    clearRungs,
    fillIncrements,
  } = useAccountModel()

  const ladder = { onUpdateRung: updateRung, onAddRung: addRung, onRemoveRung: removeRung, onClear: clearRungs, onFillIncrements: fillIncrements }

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Margin Ladder Calculator</h1>
        <p className="app__subtitle">
          Plan “buy-the-dip” ladders across a whole margin account and see how
          much you can borrow before a margin call.
        </p>
      </header>

      <details className="how">
        <summary>New to margin? How this works</summary>
        <div className="how__body">
          <p>
            When you buy stock <strong>on margin</strong> you borrow from your
            broker. In a real account every stock shares{' '}
            <strong>one margin loan</strong>, and the part you own — your{' '}
            <strong>equity</strong> — must stay above the broker’s maintenance
            requirement (each stock’s value × its <strong>EPR %</strong>).
          </p>
          <p>
            The check is on the <strong>whole account</strong>: a strong stock
            can support a weaker one (cross-collateralization). If total equity
            falls below the total maintenance requirement, you get a{' '}
            <strong>margin call</strong>.
          </p>
          <p>
            Enter a <strong>ticker</strong> to pull a live price (it refreshes
            every {PRICE_REFRESH_LABEL}), or type a price by hand. Each stock has
            its own ladder, and your <strong>loan is calculated automatically</strong>{' '}
            from everything you buy in those ladders — every margin buy spends
            some of your cushion, which is how the ladder shows when you’d be
            called. Hover any <span className="how__i">i</span> for a plain
            explanation.
          </p>
        </div>
      </details>

      {!hasApiKey() && (
        <p className="alert alert--warn">
          No {PRICE_DATA_SOURCE} API key found — live prices are disabled. Add{' '}
          <code>VITE_FINNHUB_API_KEY</code> to a <code>.env</code> file (see{' '}
          <code>.env.example</code>) and restart, or just use manual prices.
        </p>
      )}

      <main className="app__grid">
        <AccountSummary
          summary={model.summary}
          loan={account.loan}
          onLoanChange={setLoan}
          prices={prices}
        />
        <MarginGauge summary={model.summary} />

        {model.positions.map((view, i) => (
          <PositionCard
            key={view.id}
            position={account.positions[i]}
            view={view}
            onUpdatePosition={updatePosition}
            onRemovePosition={removePosition}
            ladder={ladder}
          />
        ))}

        <div className="add-stock">
          <button type="button" className="btn btn--accent" onClick={addPosition}>
            + Add stock
          </button>
        </div>
      </main>

      <footer className="app__footer">
        <p>
          Live prices via {PRICE_DATA_SOURCE}, auto-refreshed every{' '}
          {PRICE_REFRESH_LABEL} (may be delayed; verify before trading).
          Educational tool — simplified model: cross-collateralized Reg T account,
          one maintenance rate per stock, every ladder buy funded by margin and
          valued conservatively at its buy price, no interest accrual. Not
          financial advice; confirm requirements with your broker.
        </p>
      </footer>
    </div>
  )
}
