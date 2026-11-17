/** A photo stuck onto the diary page. x and w are fractions of the writing width; y is in px. */
export type DiaryImage = { p: string; x: number; y: number; w: number }

export const MAX_IMAGES = 9
export const MIN_STAMP_W = 0.2
export const MAX_STAMP_W = 0.9

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export function normalizeImages(raw: unknown): DiaryImage[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item, i): DiaryImage | null => {
      if (typeof item === 'string') return { p: item, x: i % 2 ? 0.05 : 0.55, y: 40 + i * 120, w: 0.4 }
      if (!item || typeof item !== 'object') return null
      const { p, x, y, w } = item as Record<string, unknown>
      if (typeof p !== 'string') return null
      const width = clamp(Number(w) || 0.4, MIN_STAMP_W, MAX_STAMP_W)
      return {
        p,
        w: width,
        x: clamp(Number(x) || 0, 0, 1 - width),
        y: clamp(Number(y) || 0, 0, 20000),
      }
    })
    .filter((v): v is DiaryImage => v !== null)
}

/** Stable small tilt per photo so stamps look hand-placed. */
export function tiltFor(p: string) {
  let h = 0
  for (let i = 0; i < p.length; i++) h = (h * 31 + p.charCodeAt(i)) | 0
  return ((Math.abs(h) % 9) - 4) * 0.9
}
