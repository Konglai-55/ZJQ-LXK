import { NextResponse, type NextRequest } from 'next/server'
import { canReadPartner, getCurrentPartner, setIdentityCookie } from '@/lib/identity'
import { getLockHash, removeLock, setLock } from '@/lib/lock'

export async function GET() {
  const me = await getCurrentPartner()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const mine = Boolean(await getLockHash(me.partner))
  const { locked, canRead } = await canReadPartner(me.partner)
  return NextResponse.json({ mine, theirs: locked, canReadTheirs: canRead })
}

export async function POST(request: NextRequest) {
  const me = await getCurrentPartner()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = (await request.json().catch(() => null)) as { password?: unknown } | null
  const password = body?.password
  if (typeof password !== 'string' || password.length < 4 || password.length > 64) {
    return NextResponse.json({ error: '密码要 4 到 64 位' }, { status: 400 })
  }
  const hash = await setLock(me.partner, password)
  await setIdentityCookie(me.partner, hash)
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const me = await getCurrentPartner()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await removeLock(me.partner)
  await setIdentityCookie(me.partner, null)
  return NextResponse.json({ ok: true })
}
