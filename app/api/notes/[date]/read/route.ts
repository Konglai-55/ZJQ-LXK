import { NextResponse, type NextRequest } from 'next/server'
import { editNote } from '@/lib/records'
import { getCurrentPartner } from '@/lib/identity'
import { otherPartner } from '@/lib/partners'
import { isDateKey } from '@/lib/time'

export async function POST(_request: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const me = await getCurrentPartner()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { date } = await params
  if (!isDateKey(date)) return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  await editNote(otherPartner(me.partner), date, (note) => note && note.to === me.partner && !note.readAt ? { ...note, readAt: new Date().toISOString() } : note)
  return NextResponse.json({ ok: true })
}
