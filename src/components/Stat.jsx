import InfoTooltip from './InfoTooltip.jsx'

/**
 * Reusable read-only statistic: label (+ optional info icon) and a value.
 * `tone` controls accent color: 'default' | 'good' | 'warn' | 'bad'.
 */
export default function Stat({ label, value, term, tone = 'default', big = false }) {
  return (
    <div className={`stat stat--${tone}${big ? ' stat--big' : ''}`}>
      <div className="stat__label">
        {label}
        {term && <InfoTooltip term={term} label={label} />}
      </div>
      <div className="stat__value">{value}</div>
    </div>
  )
}
