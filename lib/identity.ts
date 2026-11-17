import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { getLockHash, lockFingerprint } from '@/lib/lock'
import { isPartnerId, otherPartner, type PartnerId } from '@/lib/partners'

const IDENTITY_COOKIE = 'love-calendar-who'
const UNLOCK_COOKIE = 'love-calendar-unlock'

function sign(value: string) {
  const secret = process.env.BETTER_AUTH_SECRET
  if (!secret) throw new Error('BETTER_AUTH_SECRET is not set')
  return createHmac('sha256', secret).update(value).digest('base64url')
}

function signatureMatches(value: string, signature: string) {
  const expected = Buffer.from(sign(value))
  const given = Buffer.from(signature)
  return expected.length === given.length && timingSafeEqual(expected, given)
}

const cookieOptions = {
  httpOnly: true,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
}

export async function setIdentityCookie(partner: PartnerId, lockHash?: string | null) {
  const fp = lockFingerprint(lockHash === undefined ? await getLockHash(partner) : lockHash)
  const payload = `${partner}.${fp}`
  ;(await cookies()).set(IDENTITY_COOKIE, `${payload}.${sign(payload)}`, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 365,
  })
}

export async function clearIdentityCookies() {
  const jar = await cookies()
  jar.delete({ name: IDENTITY_COOKIE, ...cookieOptions })
  jar.delete({ name: UNLOCK_COOKIE, ...cookieOptions })
}

export async function getCurrentPartner() {
  const raw = (await cookies()).get(IDENTITY_COOKIE)?.value
  if (!raw) return null
  const [partner, fp, signature] = raw.split('.')
  if (!isPartnerId(partner) || !fp || !signature) return null
  if (!signatureMatches(`${partner}.${fp}`, signature)) return null
  if (fp !== lockFingerprint(await getLockHash(partner))) return null
  return { userId: partner, partner }
}

export async function setUnlockCookie(viewer: PartnerId, target: PartnerId, lockHash: string) {
  const payload = `${viewer}.${target}.${lockFingerprint(lockHash)}`
  ;(await cookies()).set(UNLOCK_COOKIE, `${payload}.${sign(payload)}`, {
    ...cookieOptions,
    maxAge: 60 * 60 * 12,
  })
}

/** Whether `viewer` may read the other partner's diary right now. */
export async function canReadPartner(viewer: PartnerId) {
  const target = otherPartner(viewer)
  const hash = await getLockHash(target)
  if (!hash) return { locked: false, canRead: true }
  const raw = (await cookies()).get(UNLOCK_COOKIE)?.value
  if (!raw) return { locked: true, canRead: false }
  const [v, t, fp, signature] = raw.split('.')
  const ok =
    v === viewer &&
    t === target &&
    fp === lockFingerprint(hash) &&
    !!signature &&
    signatureMatches(`${v}.${t}.${fp}`, signature)
  return { locked: true, canRead: ok }
}
