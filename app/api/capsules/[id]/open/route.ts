import { NextResponse, type NextRequest } from 'next/server'
import { editCapsules } from '@/lib/records'
import { isRecipient } from '@/lib/capsules'
import { getCurrentPartner } from '@/lib/identity'
import { todayInChina } from '@/lib/time'

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentPartner()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = Number((await params).id)
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  let found = false
  await editCapsules((records) => {
    found = false
    return records.map((record) => {
      if (record.id !== id || !isRecipient(record, me.partner)) return record
      found = true
      return record.openDate <= todayInChina() && !record.openedAt ? { ...record, openedAt: new Date().toISOString() } : record
    })
  })
  return found ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Not found' }, { status: 404 })
}
