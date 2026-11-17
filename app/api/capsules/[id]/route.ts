import { NextResponse, type NextRequest } from 'next/server'
import { editCapsules } from '@/lib/records'
import { getCurrentPartner } from '@/lib/identity'
import { todayInChina } from '@/lib/time'

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentPartner()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = Number((await params).id)
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  await editCapsules((records) => records.filter((record) => !(record.id === id && record.author === me.partner && record.openDate > todayInChina())))
  return NextResponse.json({ ok: true })
}
