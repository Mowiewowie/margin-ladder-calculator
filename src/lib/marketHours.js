// Is the US stock market in regular trading hours right now?
//
// Regular session: Mon–Fri, 9:30am–4:00pm America/New_York. We use Intl with the
// New_York time zone so DST is handled automatically. Market holidays are NOT
// accounted for (on a holiday this returns true during the would-be session) —
// the quote simply won't change, so it's a harmless extra poll.
export function isMarketOpen(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const get = (type) => parts.find((p) => p.type === type)?.value
  const weekday = get('weekday')
  if (weekday === 'Sat' || weekday === 'Sun') return false

  const minutes = parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10)
  const open = 9 * 60 + 30 // 9:30am ET
  const close = 16 * 60 // 4:00pm ET
  return minutes >= open && minutes < close
}
