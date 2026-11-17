import { signImage } from '@/lib/storage'
import { isStoragePath } from '@/lib/storage-paths'
import { NextResponse, type NextRequest } from 'next/server'
import { canReadPartner, getCurrentPartner } from '@/lib/identity'
import { listPhotos } from '@/lib/records'
import { isPhotoPath } from '@/lib/photos'

export async function GET(request: NextRequest) {
  const me = await getCurrentPartner()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const pathname = request.nextUrl.searchParams.get('pathname')
  const shared = isPhotoPath(pathname)
  if (!isStoragePath(pathname)) {
    return NextResponse.json({ error: 'Invalid pathname' }, { status: 400 })
  }

  if (!shared && !pathname.startsWith(`diary/${me.partner}/`)) {
    const { canRead } = await canReadPartner(me.partner)
    if (!canRead) return NextResponse.json({ error: 'Locked' }, { status: 403 })
  }

  try {
    if (shared) {
      const photo = (await listPhotos()).find((item) => item.pathname === pathname)
      if (!photo) return new NextResponse('Not found', { status: 404 })
    }
    return NextResponse.json({ url: await signImage(pathname) }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('Image signing failed:', error instanceof Error ? error.name : 'Unknown')
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 })
  }
}
