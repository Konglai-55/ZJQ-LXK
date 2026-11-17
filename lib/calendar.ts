export const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
export const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

const pad = (n: number) => String(n).padStart(2, '0')

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function toMonthKey(year: number, month: number) {
  return `${year}-${pad(month + 1)}`
}

export function parseDateKey(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDateZh(key: string) {
  const date = parseDateKey(key)
  return {
    full: `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`,
    weekday: `星期${'日一二三四五六'[date.getDay()]}`,
  }
}

export function shiftDateKey(key: string, days: number) {
  const date = parseDateKey(key)
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

/** Monday-first grid for a month; null cells pad the first week. */
export function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = (first.getDay() + 6) % 7
  const cells: (string | null)[] = Array.from({ length: offset }, () => null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${toMonthKey(year, month)}-${pad(d)}`)
  }
  return cells
}
