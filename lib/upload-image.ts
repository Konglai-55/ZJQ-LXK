import { uploadMetadata } from '@/lib/storage-paths'

/** Only the small signing request goes to Next.js; the file goes straight to S3. */
export async function uploadImage(file: File, purpose: 'diary' | 'photos' = 'diary') {
  if (!uploadMetadata({ type: file.type, size: file.size, purpose })) {
    throw new Error('请选择支持的图片格式，大小不能超过 8MB')
  }
  const response = await fetch('/api/upload', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: file.type, size: file.size, purpose }),
  })
  const data = await response.json().catch(() => ({})) as { pathname?: string; uploadUrl?: string; error?: string }
  if (!response.ok || !data.pathname || !data.uploadUrl) throw new Error(data.error ?? '暂时无法上传，请重试')
  const uploaded = await fetch(data.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type }, credentials: 'omit' })
  if (!uploaded.ok) throw new Error('照片没传到对象存储，请重试')
  return data.pathname
}
