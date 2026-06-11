// Shared sanitizer for numeric text inputs.
//
// We use <input type="text" inputMode="decimal"> rather than type="number"
// because React compares number-input values with LOOSE equality and will skip
// repainting when the value is numerically equal (e.g. it leaves "085" on
// screen because 085 == 85). Text inputs use strict string comparison, so once
// we sanitize the string the DOM updates correctly.
//
// Keeps digits and a single decimal point, and strips leading zeros so values
// like "01540" become "1540". Returns a string that is safe for display and for
// the parseFloat-based coercion used in the margin math.
export function sanitizeNumericInput(raw) {
  if (raw == null) return ''
  let s = String(raw).replace(/[^\d.]/g, '') // digits and dots only

  // Collapse any extra decimal points after the first.
  const dot = s.indexOf('.')
  if (dot !== -1) {
    s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, '')
  }

  // Drop leading zeros: "007" -> "7", while keeping "0", "0.5", "0." intact.
  s = s.replace(/^0+(?=\d)/, '')

  return s
}

/** Display helper: render a stored value (number | string | '') as a string. */
export function toInputString(value) {
  if (value === '' || value == null) return ''
  return String(value)
}
