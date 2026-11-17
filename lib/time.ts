/** Today's date in China (UTC+8), so letters open at local midnight no matter where the server runs. */
export function todayInChina() {
  return new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10)
}

export function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}
