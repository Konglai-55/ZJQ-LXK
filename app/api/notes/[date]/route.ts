import { NextResponse, type NextRequest } from 'next/server'
import { editNote } from '@/lib/records'
import { getCurrentPartner } from '@/lib/identity'
import { MAX_NOTE_LENGTH, isNoteKind } from '@/lib/notes'
import { otherPartner } from '@/lib/partners'
import { isDateKey, todayInChina } from '@/lib/time'

type Ctx = { params: Promise<{ date: string }> }

export async function PUT(request: NextRequest, { params }: Ctx) {
  const me = await getCurrentPartner()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { date } = await params
  if (!isDateKey(date) || date > todayInChina()) return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  const body = await request.json().catch(() => null)
  const kind = body?.kind
  const content = typeof body?.content === 'string' ? body.content.trim() : ''
  if (!isNoteKind(kind) || content.length > MAX_NOTE_LENGTH || (kind === 'note' && !content)) return NextResponse.json({ error: 'Invalid note' }, { status: 400 })
  const note = await editNote(me.partner, date, () => ({ from: me.partner, to: otherPartner(me.partner), date, kind, content, readAt: null, updatedAt: new Date().toISOString() }))
  return NextResponse.json({ note })
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const me = await getCurrentPartner()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { date } = await params
  if (!isDateKey(date)) return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  await editNote(me.partner, date, () => null)
  return NextResponse.json({ ok: true })
}
