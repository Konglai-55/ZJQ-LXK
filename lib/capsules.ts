import type { PartnerId } from '@/lib/partners'

export const CAPSULE_TARGETS = [
  { id: 'partner', label: '写给 TA' },
  { id: 'both', label: '写给我们俩' },
  { id: 'me', label: '写给未来的自己' },
] as const

export type CapsuleTarget = (typeof CAPSULE_TARGETS)[number]['id']

export const MAX_CAPSULE_TITLE = 20
export const MAX_CAPSULE_CONTENT = 3000

export function isCapsuleTarget(value: unknown): value is CapsuleTarget {
  return CAPSULE_TARGETS.some((t) => t.id === value)
}

/** Who may read a letter once it opens. The author can always see it exists. */
export function isRecipient(c: { author: string; to: string }, viewer: PartnerId) {
  if (c.to === 'both') return true
  if (c.to === 'me') return c.author === viewer
  return c.author !== viewer
}

export function canSee(c: { author: string; to: string }, viewer: PartnerId) {
  return c.author === viewer || isRecipient(c, viewer)
}
