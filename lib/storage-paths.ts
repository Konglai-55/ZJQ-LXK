export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024
export const IMAGE_TYPES = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'image/gif': 'gif', 'image/heic': 'heic', 'image/heif': 'heif',
} as const

export function isStoragePath(path: unknown): path is string {
  return typeof path === 'string' && /^(diary|photos)\/(xikun|jiaqi)\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif|heic|heif)$/.test(path)
}

export function uploadMetadata(body: unknown) {
  if (!body || typeof body !== 'object') return null
  const { type, size, purpose = 'diary' } = body as Record<string, unknown>
  if (typeof type !== 'string' || !Object.hasOwn(IMAGE_TYPES, type)) return null
  if (typeof size !== 'number' || !Number.isSafeInteger(size) || size <= 0 || size > MAX_UPLOAD_BYTES) return null
  if (purpose !== 'diary' && purpose !== 'photos') return null
  if (purpose === 'photos' && (type === 'image/heic' || type === 'image/heif')) return null
  return { type, size, purpose, ext: IMAGE_TYPES[type as keyof typeof IMAGE_TYPES] }
}
