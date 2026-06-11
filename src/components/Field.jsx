import { useId } from 'react'
import InfoTooltip from './InfoTooltip.jsx'
import { sanitizeNumericInput, toInputString } from '../lib/number.js'

/**
 * Reusable labeled numeric input: label + info icon + sanitized numeric text
 * input with an optional unit affix. Every top-level input flows through this so
 * the markup is defined once.
 *
 * Uses a text input + sanitizer (see lib/number.js) instead of type="number" so
 * leading zeros never stick. The stored value is a sanitized string ('' when
 * blank); the margin math coerces it with parseFloat.
 *
 * Props: label, value, onChange(string|''), term (glossary key), prefix ('$'),
 * suffix ('%'), hint.
 */
export default function Field({ label, value, onChange, term, prefix, suffix, hint }) {
  const id = useId()

  function handle(e) {
    onChange(sanitizeNumericInput(e.target.value))
  }

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {term && <InfoTooltip term={term} label={label} />}
      </label>
      <div className="field__control">
        {prefix && <span className="field__affix">{prefix}</span>}
        <input
          id={id}
          className="field__input"
          type="text"
          inputMode="decimal"
          value={toInputString(value)}
          onChange={handle}
        />
        {suffix && <span className="field__affix field__affix--suffix">{suffix}</span>}
      </div>
      {hint && <p className="field__hint">{hint}</p>}
    </div>
  )
}
