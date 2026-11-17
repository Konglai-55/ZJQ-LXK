'use client'

import useSWR, { mutate } from 'swr'
import type { DiaryImage } from '@/lib/diary-images'
import type { PartnerId } from '@/lib/partners'

export type Entry = {
  partner: PartnerId
  date: string
  mood: string | null
  content: string
  images: DiaryImage[]
  hasDiary: boolean
  locked: boolean
  updatedAt: string
}

type EntriesResponse = { entries: Entry[] }

export type EntryPatch = Partial<Pick<Entry, 'mood' | 'content' | 'images'>>

export const entriesKey = (month: string) => `/api/entries?month=${month}`

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('加载失败')
  return (await res.json()) as EntriesResponse
}

export function entryId(partner: string, date: string) {
  return `${date}:${partner}`
}

export function useEntries(month: string) {
  const { data, error, isLoading } = useSWR(entriesKey(month), fetcher)
  const map = new Map<string, Entry>()
  for (const e of data?.entries ?? []) map.set(entryId(e.partner, e.date), e)
  return { entries: map, error, isLoading }
}

export function revalidateAllEntries() {
  return mutate((key) => typeof key === 'string' && key.startsWith('/api/entries'))
}

function upsert(current: EntriesResponse | undefined, entry: Entry): EntriesResponse {
  const list = (current?.entries ?? []).filter(
    (e) => !(e.partner === entry.partner && e.date === entry.date),
  )
  return { entries: [...list, entry] }
}

export async function saveEntry(me: PartnerId, date: string, patch: EntryPatch) {
  const key = entriesKey(date.slice(0, 7))
  await mutate<EntriesResponse>(
    key,
    async (current) => {
      const res = await fetch(`/api/entries/${date}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error('保存失败')
      const { entry } = (await res.json()) as { entry: Entry }
      return upsert(current, entry)
    },
    {
      optimisticData: (current) => {
        const existing = current?.entries.find((e) => e.partner === me && e.date === date)
        const next: Entry = {
          partner: me,
          date,
          mood: null,
          content: '',
          images: [],
          hasDiary: false,
          locked: false,
          updatedAt: new Date().toISOString(),
          ...existing,
          ...patch,
        }
        next.hasDiary = Boolean(next.content) || next.images.length > 0
        return upsert(current, next)
      },
      rollbackOnError: true,
      populateCache: true,
      revalidate: false,
    },
  )
}
