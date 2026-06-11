import { useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { GLOSSARY } from '../lib/glossary.js'

/**
 * Accessible "i" info icon. Pass a glossary `term` (preferred) or raw `text`.
 * Shows on hover and on keyboard focus; dismissible with Escape.
 *
 * The bubble is rendered in a portal on document.body with fixed positioning so
 * it is never clipped by (or adds scrollbars to) overflow containers such as the
 * scrollable ladder table.
 */
export default function InfoTooltip({ term, text, label }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)
  const tipId = useId()
  const content = text ?? GLOSSARY[term] ?? ''

  if (!content) return null

  function show() {
    const el = btnRef.current
    if (el) {
      const r = el.getBoundingClientRect()
      setPos({ top: r.bottom + 8, left: r.left + r.width / 2 })
    }
    setOpen(true)
  }
  function hide() {
    setOpen(false)
  }

  return (
    <span className="info">
      <button
        ref={btnRef}
        type="button"
        className="info__icon"
        aria-label={label ? `What is ${label}?` : 'More information'}
        aria-expanded={open}
        aria-describedby={open ? tipId : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={() => (open ? hide() : show())}
        onKeyDown={(e) => e.key === 'Escape' && hide()}
      >
        i
      </button>
      {open &&
        createPortal(
          <span
            role="tooltip"
            id={tipId}
            className="info__bubble"
            style={{ top: pos.top, left: pos.left }}
          >
            {content}
          </span>,
          document.body
        )}
    </span>
  )
}
