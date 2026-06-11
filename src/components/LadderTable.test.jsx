import { describe, it, expect, afterEach } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import LadderTable from './LadderTable.jsx'
import { computePositionLadder } from '../lib/account.js'

afterEach(cleanup)

const POSITION = { shares: 1000, avgCost: 100, eprPct: 30, price: 100 }

/**
 * Mirrors the real data flow: rung state -> computePositionLadder -> LadderTable.
 * This is what reproduces (and now guards against) the leading-zero bug.
 */
function Harness({ initialRungs }) {
  const [rungs, setRungs] = useState(initialRungs)
  const rows = computePositionLadder({
    position: { ...POSITION, rungs },
    others: [],
    loan: 0,
  })
  const update = (id, key, value) =>
    setRungs((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: value } : r)))
  return (
    <LadderTable
      rungs={rungs}
      rows={rows}
      onUpdateRung={update}
      onAddRung={() => {}}
      onRemoveRung={() => {}}
      onFillIncrements={() => {}}
      onClear={() => {}}
    />
  )
}

const sharesInput = () => screen.getByLabelText('Shares to buy')
const priceInput = () => screen.getByLabelText('Buy price')

describe('LadderTable inputs — leading-zero / empty-field bug', () => {
  it('renders an empty field as blank, not a coerced "0"', () => {
    render(<Harness initialRungs={[{ id: 'r1', price: 90, shares: '' }]} />)
    expect(sharesInput().value).toBe('') // regression guard: must NOT be '0'
  })

  it('typing into an empty field stores the number with no leading zero', () => {
    render(<Harness initialRungs={[{ id: 'r1', price: 90, shares: '' }]} />)
    fireEvent.change(sharesInput(), { target: { value: '1540' } })
    expect(sharesInput().value).toBe('1540')
  })

  it('normalizes a stray leading zero ("01540") to "1540"', () => {
    render(<Harness initialRungs={[{ id: 'r1', price: 90, shares: 0 }]} />)
    fireEvent.change(sharesInput(), { target: { value: '01540' } })
    expect(sharesInput().value).toBe('1540')
  })

  it('backspacing all the way leaves the field blank (treated as 0 by the math)', () => {
    render(<Harness initialRungs={[{ id: 'r1', price: 90, shares: 500 }]} />)
    fireEvent.change(sharesInput(), { target: { value: '' } })
    expect(sharesInput().value).toBe('')
    // The cumulative-shares column still computes (blank -> 0 -> just the 1000 owned).
    expect(screen.getByText('1,000')).toBeInTheDocument()
  })

  it('the price field behaves the same way (strips leading zero)', () => {
    render(<Harness initialRungs={[{ id: 'r1', price: '', shares: 100 }]} />)
    expect(priceInput().value).toBe('')
    fireEvent.change(priceInput(), { target: { value: '085' } })
    expect(priceInput().value).toBe('85')
  })

  it('preserves decimals while typing a price', () => {
    render(<Harness initialRungs={[{ id: 'r1', price: '', shares: 100 }]} />)
    fireEvent.change(priceInput(), { target: { value: '42.' } })
    expect(priceInput().value).toBe('42.')
    fireEvent.change(priceInput(), { target: { value: '42.86' } })
    expect(priceInput().value).toBe('42.86')
  })
})
