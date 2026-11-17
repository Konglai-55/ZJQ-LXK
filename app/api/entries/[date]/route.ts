import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentPartner } from '@/lib/identity'
import { putEntry } from '@/lib/records'
import { isDateKey, todayInChina } from '@/lib/time'
import { isMoodId } from '@/lib/moods'
import { MAX_IMAGES, normalizeImages, type DiaryImage } from '@/lib/diary-images'

const MAX_CONTENT = 5000

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> },
) {
  const me = await getCurrentPartner()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date } = await params
  if (!isDateKey(date) || date > todayInChina()) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const updates: { mood?: string | null; content?: string; images?: DiaryImage[] } = {}

  if ('mood' in body) {
    if (body.mood !== null && !isMoodId(body.mood)) {
      return NextResponse.json({ error: 'Invalid mood' }, { status: 400 })
    }
    updates.mood = body.mood as string | null
  }

  if ('content' in body) {
    if (typeof body.content !== 'string' || body.content.length > MAX_CONTENT) {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 })
    }
    updates.content = body.content
  }

  if ('images' in body) {
    const raw = body.images
    const images = normalizeImages(raw)
    if (
      !Array.isArray(raw) ||
      raw.length !== images.length ||
      images.length > MAX_IMAGES ||
      !images.every((img) => img.p.startsWith(`diary/${me.partner}/`) && !img.p.includes('..'))
    ) {
      return NextResponse.json({ error: 'Invalid images' }, { status: 400 })
    }
    updates.images = images
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const row = await putEntry(me.partner, date, updates)
  const images = normalizeImages(row.images)
  return NextResponse.json({
    entry: { ...row, images, hasDiary: Boolean(row.content) || images.length > 0, locked: false },
  })
}
