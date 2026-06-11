# Margin Ladder Calculator

A web app for planning a **"buy-the-dip" margin ladder** across a whole stock
account, and seeing how much you can borrow before a **margin call**.

You enter your positions (shares, cost basis, the broker's maintenance rate),
optionally pull **live prices** from a ticker, then build a ladder of planned
buys at lower prices. The app models a real, **cross-collateralized Reg T
margin account** — one shared loan, with the margin call judged on the whole
account — and shows exactly how each buy eats into your cushion.

> ⚠️ Educational tool, not financial advice. It uses a simplified model and
> delayed market data. Always confirm margin requirements with your broker.

## Features

- **Live prices** — type a ticker (e.g. `AAPL`) to auto-fetch a quote that
  refreshes every 30 seconds; falls back to a manual price when offline or
  without an API key. Ticker input is debounced so it doesn't fetch mid-typing.
- **Multiple stocks** — a pooled, cross-collateralized account where a strong
  position can support a weaker one. Each stock carries its own maintenance
  rate (EPR %).
- **Per-stock buy ladders** — add rungs manually or "Fill 5% steps". The loan is
  **auto-calculated** from everything you buy; each rung shows cumulative shares,
  the account loan, account equity %, the stock's account-aware margin-call
  price, and the cushion. Rows turn red on a margin call.
- **Account summary + risk gauges** — total value, loan, equity, maintenance
  requirement, excess equity and buying power, plus an account risk gauge and a
  thin per-stock distance-to-call bar.
- **Beginner-friendly** — every figure has an "i" tooltip explaining it in plain
  language.

## How the margin math works

For the whole account:

```
Long Market Value (LMV) = Σ shares_i × price_i      (planned buys at their buy price)
Equity                  = LMV − loan                (one shared loan)
Maintenance requirement = Σ shares_i × price_i × m_i (m_i = each stock's EPR %)
Margin call when         Equity < Maintenance requirement
```

A stock's account-aware call price (others held at current prices):

```
p_j = [ loan − Σ_{i≠j} mv_i·(1 − m_i) ] / [ shares_j·(1 − m_j) ]
```

Buys are valued conservatively at their buy price, so every margin buy adds
equal market value and loan (net equity 0) while raising the maintenance
requirement — i.e. it spends your excess equity. That's how the ladder reveals
how much you can buy before a call. All of this lives in pure, unit-tested
modules in [`src/lib/`](src/lib/).

## Getting started

Prerequisites: Node 18+.

```bash
npm install

# Optional: live prices via Finnhub (free key at https://finnhub.io)
cp .env.example .env
# then edit .env and set VITE_FINNHUB_API_KEY=your_key

npm run dev      # start the dev server (http://localhost:5173)
```

Without an API key the app still works fully using manual prices.

> Note: a Vite client-side key is bundled into the build and visible to users.
> If you deploy publicly, restrict the key by domain in the Finnhub dashboard.

## Scripts

| Command              | Description                  |
| -------------------- | ---------------------------- |
| `npm run dev`        | Start the Vite dev server    |
| `npm run build`      | Production build to `dist/`  |
| `npm run preview`    | Preview the production build |
| `npm test`           | Run the Vitest suite         |
| `npm run test:watch` | Run tests in watch mode      |

## Tech stack

- **React 18** + **Vite**
- **Vitest** + **@testing-library/react** (jsdom) — pure-math and component tests
- **Finnhub** `/quote` API for live prices

## License

See [LICENSE.md](LICENSE.md).
