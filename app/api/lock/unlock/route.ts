import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentPartner, setUnlockCookie } from '@/lib/identity'
import { getLockHash, verifyPassword } from '@/lib/lock'
import { otherPartner } from '@/lib/partners'

export async function POST(request: NextRequest) {
  const me = await getCurrentPartner()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const target = otherPartner(me.partner)
  const hash = await getLockHash(target)
  if (!hash) return NextResponse.json({ ok: true })

  const body = (await request.json().catch(() => null)) as { password?: unknown } | null
  const password = body?.password
  if (typeof password !== 'string' || !(await verifyPassword(password, hash))) {
    return NextResponse.json({ error: '密码不对哦' }, { status: 403 })
  }

  await setUnlockCookie(me.partner, target, hash)
  return NextResponse.json({ ok: true })
}
