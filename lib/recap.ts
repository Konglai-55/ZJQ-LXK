import type { Entry } from '@/hooks/use-entries'
import { MOODS, type MoodId } from '@/lib/moods'
import { PARTNER_ORDER, type PartnerId } from '@/lib/partners'
import { getSpecialDays } from '@/lib/special-days'

const HAPPY = new Set<string>(['happy', 'excited', 'love'])
const SCORE: Record<string, number> = { sad: 0, calm: 1, happy: 2, excited: 3, love: 3 }

export type PartnerRecap = {
  moodCounts: Record<MoodId, number>
  recordedDays: number
  diaryCount: number
  topMood: MoodId | null
  quote: { date: string; text: string } | null
}

export type MonthRecap = {
  elapsedDays: number
  partners: Record<PartnerId, PartnerRecap>
  bothRecorded: number
  togetherHappy: number
  bestDay: { date: string; moods: Record<PartnerId, string | null> } | null
  stamps: { p: string; date: string }[]
  /** Partners whose locked diaries are hidden from this recap. */
  hiddenFor: PartnerId[]
  specials: { date: string; label: string; detail: string; kind: string }[]
}

function firstSentence(text: string) {
  const clean = text.replace(/\s+/g, ' ').trim()
  const end = clean.search(/[。！？!?]/)
  const sentence = end >= 0 ? clean.slice(0, end + 1) : clean
  return sentence.length > 34 ? `${sentence.slice(0, 34)}…` : sentence
}

export function computeRecap(
  dates: (string | null)[],
  todayKey: string,
  entries: Map<string, Entry>,
): MonthRecap {
  const days = dates.filter((d): d is string => d !== null && d <= todayKey)
  const get = (p: PartnerId, d: string) => entries.get(`${d}:${p}`)

  const partners = {} as Record<PartnerId, PartnerRecap>
  for (const p of PARTNER_ORDER) {
    const moodCounts = Object.fromEntries(MOODS.map((m) => [m.id, 0])) as Record<MoodId, number>
    let diaryCount = 0
    let recordedDays = 0
    let quote: PartnerRecap['quote'] = null
    for (const d of days) {
      const e = get(p, d)
      if (!e) continue
      if (e.mood && e.mood in moodCounts) {
        moodCounts[e.mood as MoodId]++
        recordedDays++
      }
      if (e.hasDiary) diaryCount++
      // Locked diaries arrive without text, so they never leak into the recap.
      if (e.content.trim()) quote = { date: d, text: firstSentence(e.content) }
    }
    const top = MOODS.reduce<MoodId | null>(
      (best, m) => (moodCounts[m.id] > (best ? moodCounts[best] : 0) ? m.id : best),
      null,
    )
    partners[p] = { moodCounts, recordedDays, diaryCount, topMood: top, quote }
  }

  let bothRecorded = 0
  let togetherHappy = 0
  let bestDay: MonthRecap['bestDay'] = null
  let bestScore = -1
  for (const d of days) {
    const [a, b] = PARTNER_ORDER.map((p) => get(p, d)?.mood ?? null)
    if (!a || !b) continue
    bothRecorded++
    if (HAPPY.has(a) && HAPPY.has(b)) togetherHappy++
    const score = (SCORE[a] ?? 0) + (SCORE[b] ?? 0)
    if (score > bestScore) {
      bestScore = score
      bestDay = { date: d, moods: { jiaqi: get('jiaqi', d)?.mood ?? null, xikun: get('xikun', d)?.mood ?? null } }
    }
  }

  const stamps: MonthRecap['stamps'] = []
  for (const d of days) {
    for (const p of PARTNER_ORDER) for (const img of get(p, d)?.images ?? []) stamps.push({ p: img.p, date: d })
  }

  const hiddenFor = PARTNER_ORDER.filter((p) => days.some((d) => get(p, d)?.locked && get(p, d)?.hasDiary))

  const specials = dates.flatMap((d) => (d ? getSpecialDays(d).map((s) => ({ date: d, ...s })) : []))

  return { elapsedDays: days.length, partners, bothRecorded, togetherHappy, bestDay, stamps: stamps.slice(0, 6), hiddenFor, specials }
}
