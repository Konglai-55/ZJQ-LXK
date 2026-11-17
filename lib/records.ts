import { createHash, randomInt } from 'node:crypto'
import { listData, readData, updateData } from '@/lib/object-data'
import type { DiaryImage } from '@/lib/diary-images'
import type { PartnerId } from '@/lib/partners'
import type { NoteKind } from '@/lib/notes'
import type { CapsuleTarget } from '@/lib/capsules'
import type { SharedPhoto } from '@/lib/photos'

export type EntryRecord = { partner: PartnerId; date: string; mood: string | null; content: string; images: DiaryImage[]; updatedAt: string }
export type NoteRecord = { from: PartnerId; to: PartnerId; date: string; kind: NoteKind; content: string; readAt: string | null; updatedAt: string }
export type CapsuleRecord = { id: number; author: PartnerId; to: CapsuleTarget; openDate: string; title: string; content: string; openedAt: string | null; createdAt: string }

// ponytail: monthly JSON for two people; split into per-day objects if records become large.
export async function listEntries(month: string) {
  return Object.values(await readData<Record<string, EntryRecord>>(`entries/${month}`) ?? {})
}
export async function putEntry(partner: PartnerId, date: string, patch: Partial<Pick<EntryRecord, 'mood' | 'content' | 'images'>>) {
  const id = `${date}:${partner}`
  const records = await updateData<Record<string, EntryRecord>>(`entries/${date.slice(0, 7)}`, (current) => ({
    ...current,
    [id]: { partner, date, mood: null, content: '', images: [], ...current?.[id], ...patch, updatedAt: new Date().toISOString() },
  }))
  return records[id]
}
export async function listNotes(month?: string) {
  if (month) return Object.values(await readData<Record<string, NoteRecord>>(`notes/${month}`) ?? {})
  return (await listData<Record<string, NoteRecord>>('notes/')).flatMap(Object.values)
}
export async function editNote(from: PartnerId, date: string, change: (current: NoteRecord | null) => NoteRecord | null) {
  const id = `${date}:${from}`
  const result = await updateData<Record<string, NoteRecord>>(`notes/${date.slice(0, 7)}`, (current) => {
    const next = { ...current }
    const value = change(next[id] ?? null)
    if (value) next[id] = value
    else delete next[id]
    return next
  })
  return result[id] ?? null
}
export const listCapsules = async () => await readData<CapsuleRecord[]>('capsules') ?? []
export async function createCapsule(input: Omit<CapsuleRecord, 'id' | 'createdAt' | 'openedAt'>) {
  const record = { ...input, id: randomInt(1, 0xffffffffffff), createdAt: new Date().toISOString(), openedAt: null }
  await updateData<CapsuleRecord[]>('capsules', (current) => {
    if (current?.some((item) => item.id === record.id)) throw new Error('请重新封存')
    return [...current ?? [], record]
  })
  return record
}
export const editCapsules = (change: (current: CapsuleRecord[]) => CapsuleRecord[]) => updateData<CapsuleRecord[]>('capsules', (current) => change(current ?? []))
export const listPhotos = async () => (await readData<SharedPhoto[]>('photos') ?? []).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
export async function putPhoto(author: PartnerId, pathname: string, fields: Pick<SharedPhoto, 'date' | 'title' | 'story'>) {
  const id = parseInt(createHash('sha256').update(pathname).digest('hex').slice(0, 12), 16)
  const photo = { id, author, pathname, ...fields }
  await updateData<SharedPhoto[]>('photos', (current) => {
    const previous = current?.find((item) => item.id === id)
    if (previous && (previous.author !== author || previous.pathname !== pathname)) throw new Error('照片编号冲突，请重新上传')
    return [...(current ?? []).filter((item) => item.id !== id), photo]
  })
  return photo
}
export async function editPhoto(author: PartnerId, id: number, fields: Pick<SharedPhoto, 'date' | 'title' | 'story'> | null) {
  let result: SharedPhoto | null = null
  await updateData<SharedPhoto[]>('photos', (current) => {
    result = null
    const own = current?.find((item) => item.id === id && item.author === author)
    if (!own) return current ?? []
    result = { ...own, ...fields }
    return fields ? current!.map((item) => item.id === id ? result! : item) : current!.filter((item) => item.id !== id)
  })
  return result as SharedPhoto | null
}
