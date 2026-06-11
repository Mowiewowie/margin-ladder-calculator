// Single source for every info-tooltip explanation, keyed by term.
// Written for someone brand new to margin trading.

export const GLOSSARY = {
  ticker:
    'The stock symbol (e.g. AAPL). Enter one to pull a live price that refreshes automatically. Leave it blank to type the price in by hand.',
  livePrice:
    'The latest price pulled from the market data provider. It refreshes on a timer; if it can\'t be fetched (no API key, market closed, bad symbol) the app uses your manual price instead.',
  manualPrice:
    'A price you type in yourself. Used when no ticker is set or a live quote is unavailable, so the calculator always works.',
  sharedLoan:
    'Your single account-wide margin loan. It is auto-calculated: every share you buy in your ladders is borrowed and added here, on top of any existing balance you enter. In a real margin account all stocks share one loan.',
  existingLoan:
    'Money you ALREADY owe the broker before any ladder buys (your starting debit balance). Leave it at $0 if you own your current shares outright — the ladders below add the borrowing automatically.',
  accountEquity:
    'The part of your whole account that is truly yours: total market value of all stocks minus the shared loan.',
  maintenanceRequirement:
    'The total equity your broker requires you to keep, added up across stocks: each stock\'s market value times its EPR%. A margin call hits when your equity falls below this total.',
  excessEquity:
    'Your account equity minus the maintenance requirement — the cushion before a margin call. When it goes negative you are called.',
  crossCollateral:
    'Because all stocks share one account, a strong position can support a weak one. The margin call is judged on the whole account, not stock by stock.',
  symbolCallPrice:
    'The price THIS stock can fall to (with your other stocks held steady) before the whole account hits a margin call. The more you borrow, the higher it climbs.',
  sharesOwned:
    'The number of shares you already hold in this stock before adding any new "ladder" buys.',
  avgCost:
    'Your average cost basis — the average price you originally paid per share. Used to show your profit or loss, not the margin-call math.',
  currentPrice:
    'What the stock trades at right now. Your starting position and totals are valued at this price.',
  eprPct:
    'Equity Percentage Requirement (the bank\'s maintenance margin). It is the minimum slice of your position you must own outright. If your equity falls below this percentage of the market value, you get a margin call. Brokers commonly set 25–40%.',
  startingLoan:
    'Money you have already borrowed from your broker against this position (your "debit balance"). Leave it at $0 if you own your current shares outright. New ladder buys add to this.',
  marketValue:
    'The total dollar value of your shares at the current price (shares × price).',
  equity:
    'The part of the position that is truly yours: market value minus the money you owe the broker (the loan).',
  equityPct:
    'Account equity as a percentage of total market value. A margin call happens when this drops below your blended maintenance requirement. Higher is safer.',
  marginLoan:
    'The total amount you owe the broker (debit balance). Each margin-funded buy increases it by shares × price.',
  marginCall:
    'A demand from your broker to add cash or sell shares because your equity has fallen below the maintenance requirement (EPR%). Forced selling often happens at the worst time.',
  marginCallPrice:
    'The stock price at which your equity% would fall exactly to the EPR%. If the price drops below this, you are in a margin call. The more you borrow, the higher (closer) this price climbs.',
  cushionToCall:
    'How far the stock can still fall, as a percentage, before you hit the margin-call price. Smaller cushion = more risk.',
  maxSharesSuggestion:
    'The most shares you could buy at this price, fully on margin, and still sit right at the EPR limit. Buying this many leaves zero room for a further drop, so treat it as a ceiling, not a target.',
  buyingPower:
    'Roughly how many more dollars you could borrow against your current equity under a typical 50% initial-margin rule. Shown for context — borrowing to the limit is risky.',
  blendedAvgCost:
    'Your new average cost per share after blending the original shares with all the ladder buys.',
  unrealizedPL:
    'Your current paper profit or loss: market value of all shares minus everything you have invested in them.',
  totalInvested:
    'Total dollars put into the position: original shares (shares × your avg cost) plus the cost of every ladder buy.',
  ladderBuy:
    'A planned purchase at a lower price as the stock dips. In this app every ladder buy is funded entirely by your margin loan, which is what increases your margin-call risk.',
}
