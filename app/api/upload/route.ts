import { randomUUID } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentPartner } from '@/lib/identity'
import { signUpload } from '@/lib/storage'
import { uploadMetadata } from '@/lib/storage-paths'

export async function POST(request: NextRequest) {
  const me = await getCurrentPartner()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const file = uploadMetadata(await request.json().catch(() => null))
    if (!file) return NextResponse.json({ error: '图片格式、大小或上传位置不正确（最大 8MB）' }, { status: 400 })
    const pathname = `${file.purpose}/${me.partner}/${randomUUID()}.${file.ext}`
    const uploadUrl = await signUpload(pathname, file.type, file.size)
    return NextResponse.json({ pathname, uploadUrl }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Upload signing failed:', error instanceof Error ? error.name : 'Unknown')
    return NextResponse.json({ error: '上传失败，请再试一次' }, { status: 500 })
  }
}
