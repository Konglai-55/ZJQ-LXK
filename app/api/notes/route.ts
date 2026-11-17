import { NextResponse, type NextRequest } from 'next/server'
import { listNotes } from '@/lib/records'
import { getCurrentPartner } from '@/lib/identity'

export async function GET(request: NextRequest) {
  const me = await getCurrentPartner()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const params = request.nextUrl.searchParams
  if (params.get('unread') === '1') {
    const notes = (await listNotes()).filter((note) => note.to === me.partner && !note.readAt).sort((a, b) => a.date.localeCompare(b.date))
    return NextResponse.json({ notes })
  }
  const month = params.get('month') ?? ''
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return NextResponse.json({ error: 'Invalid month' }, { status: 400 })
  return NextResponse.json({ notes: (await listNotes(month)).filter((note) => note.from === me.partner || note.to === me.partner) })
}
