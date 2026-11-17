'use client'

import useSWR, { mutate } from 'swr'
import type { NoteKind } from '@/lib/notes'
import type { PartnerId } from '@/lib/partners'

export type Note = {
  from: PartnerId
  to: PartnerId
  date: string
  kind: NoteKind
  content: string
  readAt: string | null
  updatedAt: string
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('加载失败')
  return ((await res.json()) as { notes: Note[] }).notes
}

export const noteId = (from: string, date: string) => `${date}:${from}`

export function useNotes(month: string) {
  const { data } = useSWR(`/api/notes?month=${month}`, fetcher)
  const map = new Map<string, Note>()
  for (const n of data ?? []) map.set(noteId(n.from, n.date), n)
  return map
}

export function useUnreadNotes() {
  const { data } = useSWR('/api/notes?unread=1', fetcher)
  return data ?? []
}

function refreshNotes() {
  return mutate((key) => typeof key === 'string' && key.startsWith('/api/notes'))
}

export async function sendNote(date: string, kind: NoteKind, content: string) {
  const res = await fetch(`/api/notes/${date}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, content }),
  })
  if (!res.ok) throw new Error('没送出去，再试一次')
  await refreshNotes()
}

export async function removeNote(date: string) {
  const res = await fetch(`/api/notes/${date}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('没收回，再试一次')
  await refreshNotes()
}

export async function markNoteRead(date: string) {
  await fetch(`/api/notes/${date}/read`, { method: 'POST' })
  await refreshNotes()
}
