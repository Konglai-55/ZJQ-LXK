import { deleteImage } from '@/lib/storage'
import { NextResponse, type NextRequest } from 'next/server'
import { listPhotos, putPhoto, editPhoto } from '@/lib/records'
import { getCurrentPartner } from '@/lib/identity'
import { isPhotoPath, photoFields } from '@/lib/photos'
import { todayInChina } from '@/lib/time'

export async function GET() {
  if (!(await getCurrentPartner())) return NextResponse.json({ error: '请先选择身份' }, { status: 401 })
  try {
    return NextResponse.json({ photos: await listPhotos() })
  } catch (error) {
    console.error('Photo wall read failed:', error)
    return NextResponse.json({ error: '合照暂时没加载出来，请稍后重试' }, { status: 500 })
  }
}

async function write(request: NextRequest, method: 'POST' | 'PATCH' | 'DELETE') {
  const me = await getCurrentPartner()
  if (!me) return NextResponse.json({ error: '请先选择身份' }, { status: 401 })
  const raw = await request.json().catch(() => null)
  const body = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : null
  const fields = photoFields(body)
  const id = body?.id
  if (method !== 'POST' && (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0)) {
    return NextResponse.json({ error: '这张照片不存在' }, { status: 400 })
  }
  if (method !== 'DELETE' && (!fields || fields.date > todayInChina())) {
    return NextResponse.json({ error: '请检查拍摄日期、标题和故事的长度' }, { status: 400 })
  }
  if (method === 'POST' && !isPhotoPath(body?.pathname, me.partner)) {
    return NextResponse.json({ error: '请先上传一张合照' }, { status: 400 })
  }
  try {
    if (method === 'POST') {
      const photo = await putPhoto(me.partner, body!.pathname as string, fields!)
      return NextResponse.json({ photo }, { status: 201 })
    }
    const photo = await editPhoto(me.partner, id as number, method === 'PATCH' ? fields! : null)
    if (!photo) return NextResponse.json({ error: '只能修改或移除自己上传的合照' }, { status: 403 })
    if (method === 'DELETE') {
      await deleteImage(photo.pathname).catch((error) => console.error('Photo cleanup failed:', error instanceof Error ? error.name : 'Unknown'))
    }
    return NextResponse.json({ photo })
  } catch (error) {
    console.error('Photo wall write failed:', error)
    return NextResponse.json({ error: '没有保存成功，内容还在，请重试' }, { status: 500 })
  }
}

export const POST = (request: NextRequest) => write(request, 'POST')
export const PATCH = (request: NextRequest) => write(request, 'PATCH')
export const DELETE = (request: NextRequest) => write(request, 'DELETE')
