import { Solar } from 'lunar-javascript'

/** The day we got together counts as day 1. */
export const TOGETHER_DATE = '2026-11-07'
export const HUNDRED_DAYS = 100

export type SpecialKind = 'anniversary' | 'hundred' | 'holiday'
export type SpecialDay = { kind: SpecialKind; label: string; detail: string }

function parts(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return { y, m, d }
}

const utcDay = (key: string) => {
  const { y, m, d } = parts(key)
  return Date.UTC(y, m - 1, d) / 86_400_000
}

/** Whole days from a to b (positive when b is later). */
export function diffDays(a: string, b: string) {
  return utcDay(b) - utcDay(a)
}

/** The next wedding-style anniversary of getting together that falls after `after`. */
export function nextAnniversary(after: string) {
  const first = Number(TOGETHER_DATE.slice(0, 4)) + 1
  for (let y = first; y < first + 100; y++) {
    const key = `${y}${TOGETHER_DATE.slice(4)}`
    if (key > after) return { date: key, years: y - first + 1 }
  }
  return { date: `${first}${TOGETHER_DATE.slice(4)}`, years: 1 }
}

/** 1 on the day we got together, 2 the day after, and so on; null before that. */
export function daysTogether(key: string) {
  const n = utcDay(key) - utcDay(TOGETHER_DATE) + 1
  return n >= 1 ? n : null
}

export function dateOfDay(n: number) {
  const t = new Date((utcDay(TOGETHER_DATE) + n - 1) * 86_400_000)
  return t.toISOString().slice(0, 10)
}

const SOLAR_HOLIDAYS: Record<string, string> = {
  '01-01': '元旦',
  '02-14': '情人节',
  '03-08': '妇女节',
  '05-01': '劳动节',
  '05-20': '520',
  '06-01': '儿童节',
  '10-01': '国庆节',
  '12-24': '平安夜',
  '12-25': '圣诞节',
}

const LUNAR_HOLIDAYS: Record<string, string> = {
  '1-1': '春节',
  '1-15': '元宵节',
  '5-5': '端午节',
  '7-7': '七夕',
  '8-15': '中秋节',
}

function holidayOf(key: string) {
  const { y, m, d } = parts(key)
  const mmdd = key.slice(5)
  if (SOLAR_HOLIDAYS[mmdd]) return SOLAR_HOLIDAYS[mmdd]

  const lunar = Solar.fromYmd(y, m, d).getLunar()
  if (lunar.getJieQi() === '清明') return '清明节'

  // A negative lunar month marks a leap month, which has no festivals.
  const lm = lunar.getMonth()
  if (lm > 0 && LUNAR_HOLIDAYS[`${lm}-${lunar.getDay()}`]) return LUNAR_HOLIDAYS[`${lm}-${lunar.getDay()}`]

  const tomorrow = Solar.fromYmd(y, m, d).next(1).getLunar()
  if (tomorrow.getMonth() === 1 && tomorrow.getDay() === 1) return '除夕'
  return null
}

const cache = new Map<string, SpecialDay[]>()

/** Highest priority first: our days, then holidays. */
export function getSpecialDays(key: string): SpecialDay[] {
  const hit = cache.get(key)
  if (hit) return hit

  const list: SpecialDay[] = []
  const n = daysTogether(key)

  if (key.slice(5) === TOGETHER_DATE.slice(5) && n !== null) {
    const years = Number(key.slice(0, 4)) - Number(TOGETHER_DATE.slice(0, 4))
    list.push(
      years === 0
        ? { kind: 'anniversary', label: '在一起', detail: '我们在一起的第一天' }
        : { kind: 'anniversary', label: `${years}周年`, detail: `在一起 ${years} 周年纪念日` },
    )
  }
  if (n === HUNDRED_DAYS) list.push({ kind: 'hundred', label: '第100天', detail: '在一起的第 100 天' })

  const holiday = holidayOf(key)
  if (holiday) list.push({ kind: 'holiday', label: holiday, detail: holiday })

  cache.set(key, list)
  return list
}
