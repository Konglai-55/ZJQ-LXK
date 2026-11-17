import type { PartnerId } from '@/lib/partners'

export type SharedPhoto = {
  id: number
  author: PartnerId
  pathname: string
  date: string
  title: string
  story: string
}

export const MAX_PHOTO_TITLE = 40
export const MAX_PHOTO_STORY = 3000

export function validPhotoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function isPhotoPath(value: unknown, owner?: PartnerId): boolean {
  return typeof value === 'string' && /^photos\/(xikun|jiaqi)\/[a-zA-Z0-9-]+\.(jpg|png|webp|gif)$/.test(value) && (!owner || value.startsWith(`photos/${owner}/`))
}

export function photoFields(body: Record<string, unknown> | null) {
  if (!body || !validPhotoDate(body.date) || typeof body.title !== 'string' || typeof body.story !== 'string') return null
  const title = body.title.trim()
  const story = body.story.trim()
  return title.length <= MAX_PHOTO_TITLE && story.length <= MAX_PHOTO_STORY ? { date: body.date, title, story } : null
}
