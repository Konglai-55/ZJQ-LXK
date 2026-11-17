import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { isStoragePath } from '@/lib/storage-paths'

let client: S3Client | undefined
export function storageClient() {
  const accessKeyId = process.env.S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY
  if (!accessKeyId || !secretAccessKey) throw new Error('对象存储密钥尚未配置')
  return client ??= new S3Client({
    endpoint: process.env.S3_ENDPOINT ?? 'https://cn-nb1.rains3.com',
    region: process.env.S3_REGION ?? 'cn-nb1',
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })
}

const bucket = () => process.env.S3_BUCKET ?? 'zjq'
export async function signUpload(pathname: string, type: string, size: number) {
  if (!isStoragePath(pathname)) throw new Error('图片路径不正确')
  return getSignedUrl(storageClient(), new PutObjectCommand({ Bucket: bucket(), Key: pathname, ContentType: type, ContentLength: size }), {
    expiresIn: 300,
    signableHeaders: new Set(['content-type', 'content-length']),
  })
}

export async function signImage(pathname: string) {
  if (!isStoragePath(pathname)) throw new Error('图片路径不正确')
  return getSignedUrl(storageClient(), new GetObjectCommand({ Bucket: bucket(), Key: pathname, ResponseCacheControl: 'private, max-age=240' }), { expiresIn: 300 })
}

export async function deleteImage(pathname: string) {
  if (!isStoragePath(pathname)) throw new Error('图片路径不正确')
  await storageClient().send(new DeleteObjectCommand({ Bucket: bucket(), Key: pathname }))
}
