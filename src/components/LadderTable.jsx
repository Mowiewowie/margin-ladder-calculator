import InfoTooltip from './InfoTooltip.jsx'
import { THIN_CUSHION_PCT } from '../lib/constants.js'
import {
  formatCurrency,
  formatPercent,
  formatShares,
} from '../lib/format.js'
import { sanitizeNumericInput, toInputString } from '../lib/number.js'

/**
 * Editable ladder of margin-funded buys with cumulative, computed columns.
 * Rows come pre-sorted (highest buy price first) and pre-computed from the
 * model, so this component only renders and wires edits — no math here.
 */
export default function LadderTable({
  rungs,
  rows,
  onUpdateRung,
  onAddRung,
  onRemoveRung,
  onFillIncrements,
  onClear,
}) {
  // Editable inputs bind to the RAW rung state (kept empty when blank) so an
  // empty field never renders as a coerced "0" that typed digits append to.
  // Text inputs + sanitizer (see lib/number.js) also prevent stuck leading
  // zeros. Computed columns still use the coerced numbers from `rows`.
  const rawById = new Map(rungs.map((r) => [r.id, r]))

  return (
    <section className="panel">
      <div className="panel__header">
        <h2 className="panel__title">
          Buy Ladder
          <InfoTooltip term="ladderBuy" label="ladder buy" />
        </h2>
        <div className="ladder__actions">
          <button type="button" className="btn" onClick={onAddRung}>
            + Add rung
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => onFillIncrements({ stepPct: 0.05, count: 5, sharesPer: 200 })}
            title="Replace the ladder with five rungs, each 5% of the current price lower"
          >
            Fill 5% steps
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClear}>
            Clear
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="ladder">
          <thead>
            <tr>
              <th className="ladder__remove-col" aria-label="Remove" />
              <th>
                Buy Price
              </th>
              <th>
                Shares to Buy
              </th>
              <th>
                Max Before Call
                <InfoTooltip term="maxSharesSuggestion" label="max shares" />
              </th>
              <th>Cumulative Shares</th>
              <th>
                Account Loan
                <InfoTooltip term="sharedLoan" label="shared loan" />
              </th>
              <th>
                Account Equity %
                <InfoTooltip term="equityPct" label="account equity percent" />
              </th>
              <th>
                Call Price
                <InfoTooltip term="symbolCallPrice" label="this stock's call price" />
              </th>
              <th>
                Cushion
                <InfoTooltip term="cushionToCall" label="cushion to call" />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="ladder__empty">
                  No rungs yet. Add a rung or use “Fill 5% steps” to simulate
                  buying the dip.
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const tone = row.called
                ? 'row--bad'
                : row.cushionPct < THIN_CUSHION_PCT
                  ? 'row--warn'
                  : ''
              const maxShares = Number.isFinite(row.maxSharesBeforeCall)
                ? Math.floor(row.maxSharesBeforeCall)
                : Infinity
              const raw = rawById.get(row.id) ?? {}
              return (
                <tr key={row.id} className={tone}>
                  <td className="ladder__remove-col">
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Remove rung"
                      onClick={() => onRemoveRung(row.id)}
                    >
                      ×
                    </button>
                  </td>
                  <td>
                    <div className="cell-input cell-input--price">
                      <span className="cell-input__affix">$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        aria-label="Buy price"
                        value={toInputString(raw.price)}
                        onChange={(e) =>
                          onUpdateRung(row.id, 'price', sanitizeNumericInput(e.target.value))
                        }
                      />
                    </div>
                  </td>
                  <td>
                    <div className="cell-input">
                      <input
                        type="text"
                        inputMode="decimal"
                        aria-label="Shares to buy"
                        value={toInputString(raw.shares)}
                        onChange={(e) =>
                          onUpdateRung(row.id, 'shares', sanitizeNumericInput(e.target.value))
                        }
                      />
                    </div>
                  </td>
                  <td className="num">
                    {Number.isFinite(maxShares) ? (
                      <button
                        type="button"
                        className="link-btn"
                        title="Use this as the shares to buy"
                        onClick={() => onUpdateRung(row.id, 'shares', maxShares)}
                      >
                        {formatShares(maxShares)}
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="num">{formatShares(row.cumulativeShares)}</td>
                  <td className="num">{formatCurrency(row.cumulativeLoan)}</td>
                  <td className="num">{formatPercent(row.equityPct)}</td>
                  <td className="num">{row.callPrice > 0 ? formatCurrency(row.callPrice) : '—'}</td>
                  <td className="num">
                    {row.called ? (
                      <span className="badge badge--bad">Margin call</span>
                    ) : (
                      formatPercent(row.cushionPct)
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="ladder__note">
        Each row buys this stock on margin at that price, with your{' '}
        <strong>other stocks held at their current price</strong>. Equity %, the
        call price and the cushion are judged on your <strong>whole account</strong>
        {' '}(one shared loan). Rows turn <span className="swatch swatch--bad" />{' '}
        red when the account would be margin-called and{' '}
        <span className="swatch swatch--warn" /> amber when the cushion is thin.
      </p>
    </section>
  )
}
