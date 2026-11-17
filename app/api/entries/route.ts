import { NextResponse, type NextRequest } from 'next/server'
import { canReadPartner, getCurrentPartner } from '@/lib/identity'
import { listEntries } from '@/lib/records'
import { normalizeImages } from '@/lib/diary-images'

export async function GET(request: NextRequest) {
  const me = await getCurrentPartner()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const month = request.nextUrl.searchParams.get('month') ?? ''
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'Invalid month' }, { status: 400 })
  }

  const { canRead } = await canReadPartner(me.partner)

  const rows = await listEntries(month)

  const result = rows.map((row) => {
    const images = normalizeImages(row.images)
    const hasDiary = Boolean(row.content) || images.length > 0
    // A locked partner's words and photos stay on the server until the password is entered.
    if (row.partner !== me.partner && !canRead) {
      return { ...row, content: '', images: [], hasDiary, locked: true }
    }
    return { ...row, images, hasDiary, locked: false }
  })

  return NextResponse.json({ entries: result })
}
