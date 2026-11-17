export type MoodShape = 'circle' | 'square'

export const PARTNERS = {
  jiaqi: { id: 'jiaqi', name: '祝佳琪', shape: 'circle' as MoodShape },
  xikun: { id: 'xikun', name: '梁熙坤', shape: 'square' as MoodShape },
} as const

export type PartnerId = keyof typeof PARTNERS

/** Display order: girl (circle) row first, boy (square) row second. */
export const PARTNER_ORDER: PartnerId[] = ['jiaqi', 'xikun']

export function isPartnerId(value: unknown): value is PartnerId {
  return value === 'xikun' || value === 'jiaqi'
}

export function otherPartner(id: PartnerId): PartnerId {
  return id === 'xikun' ? 'jiaqi' : 'xikun'
}
