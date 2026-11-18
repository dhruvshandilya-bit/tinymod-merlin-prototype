export const cn = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ')

export const money = (n: number | null | undefined, dp = 2) =>
  n === null || n === undefined || isNaN(n as number)
    ? '—'
    : (n as number).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: dp, maximumFractionDigits: dp })

export const pct = (n: number | null | undefined, dp = 1) =>
  n === null || n === undefined || isNaN(n as number) ? '—' : `${+((n as number) * 100).toFixed(dp)}%`

/** Round to cents the way a spreadsheet displays currency. */
export const cents = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export const shortDate = (iso?: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(+d)) return String(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
