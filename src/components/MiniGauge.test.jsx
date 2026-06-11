import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import MiniGauge from './MiniGauge.jsx'

afterEach(cleanup)

describe('MiniGauge', () => {
  it('shows the call price and current price inline, plus the cushion', () => {
    render(<MiniGauge price={100} callPrice={75} called={false} />)
    expect(screen.getByText('$75.00')).toBeInTheDocument() // call price label (yellow)
    expect(screen.getByText('$100.00')).toBeInTheDocument() // current price label (blue)
    expect(screen.getByText(/cushion/i)).toBeInTheDocument()
    expect(screen.getByText('25.0%')).toBeInTheDocument() // (100-75)/100
  })

  it('shows a margin-call state when the call price is above the price', () => {
    render(<MiniGauge price={100} callPrice={120} called />)
    expect(screen.getByText(/margin call/i)).toBeInTheDocument()
  })

  it('shows an explanatory note when there is no call (no loan against it)', () => {
    render(<MiniGauge price={100} callPrice={0} called={false} />)
    expect(screen.getByText(/No margin call for this stock/i)).toBeInTheDocument()
    expect(screen.queryByText(/cushion/i)).toBeNull()
  })
})
