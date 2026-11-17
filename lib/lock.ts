import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { readData, updateData } from '@/lib/object-data'
import type { PartnerId } from '@/lib/partners'

const scrypt = promisify(scryptCb) as (pw: string, salt: string, len: number) => Promise<Buffer>

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const key = await scrypt(password, salt, 32)
  return `${salt}:${key.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, hex] = stored.split(':')
  if (!salt || !hex) return false
  const key = await scrypt(password, salt, 32)
  const expected = Buffer.from(hex, 'hex')
  return expected.length === key.length && timingSafeEqual(expected, key)
}

export async function getLockHash(partner: PartnerId) {
  const row = await readData<{ hash: string | null }>(`locks/${partner}`)
  return row?.hash ?? null
}

/** Changes whenever the password changes, invalidating cookies issued under the old one. */
export function lockFingerprint(hash: string | null) {
  return hash ? hash.slice(-16) : '0'
}

export async function setLock(partner: PartnerId, password: string) {
  const hash = await hashPassword(password)
  await updateData(`locks/${partner}`, () => ({ hash }))
  return hash
}

export async function removeLock(partner: PartnerId) {
  await updateData(`locks/${partner}`, () => ({ hash: null }))
}
