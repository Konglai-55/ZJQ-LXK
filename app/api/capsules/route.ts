import { NextResponse, type NextRequest } from 'next/server'
import { listCapsules, createCapsule } from '@/lib/records'
import {
  MAX_CAPSULE_CONTENT,
  MAX_CAPSULE_TITLE,
  canSee,
  isCapsuleTarget,
  isRecipient,
} from '@/lib/capsules'
import { getCurrentPartner } from '@/lib/identity'
import { isDateKey, todayInChina } from '@/lib/time'

export async function GET() {
  const me = await getCurrentPartner()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = todayInChina()
  const rows = (await listCapsules()).sort((a, b) => a.openDate.localeCompare(b.openDate))

  const list = rows
    .filter((c) => canSee(c, me.partner))
    .map((c) => {
      const sealed = c.openDate > today
      return {
        id: c.id,
        author: c.author,
        to: c.to,
        openDate: c.openDate,
        title: c.title,
        createdAt: c.createdAt,
        openedAt: c.openedAt,
        sealed,
        mine: c.author === me.partner,
        forMe: isRecipient(c, me.partner),
        // The words stay on the server until the opening day.
        content: sealed ? '' : c.content,
      }
    })

  return NextResponse.json({ capsules: list, today })
}

export async function POST(request: NextRequest) {
  const me = await getCurrentPartner()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const to = body?.to
  const openDate = body?.openDate
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const content = typeof body?.content === 'string' ? body.content.trim() : ''

  if (!isCapsuleTarget(to) || !isDateKey(openDate) || openDate <= todayInChina()) {
    return NextResponse.json({ error: '开启日期要在今天之后' }, { status: 400 })
  }
  if (!content || content.length > MAX_CAPSULE_CONTENT || title.length > MAX_CAPSULE_TITLE) {
    return NextResponse.json({ error: '信的内容不合适' }, { status: 400 })
  }

  const row = await createCapsule({ author: me.partner, to, openDate, title, content })
  return NextResponse.json({ id: row.id })
}
