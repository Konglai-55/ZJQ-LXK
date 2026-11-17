import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3'
import { storageClient } from '@/lib/storage'

const bucket = () => process.env.S3_BUCKET ?? 'zjq'
function key(name: string) {
  if (!/^[a-z0-9/-]+$/.test(name) || name.includes('..')) throw new Error('Invalid data key')
  return `data/${name}.json`
}
function status(error: unknown) {
  return (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode
}

async function read<T>(name: string): Promise<{ value: T | null; etag?: string }> {
  try {
    const result = await storageClient().send(new GetObjectCommand({ Bucket: bucket(), Key: key(name) }))
    const text = await result.Body?.transformToString()
    if (!text || !result.ETag) throw new Error('Invalid stored record')
    return { value: JSON.parse(text) as T, etag: result.ETag }
  } catch (error) {
    if (status(error) === 404) return { value: null }
    throw error
  }
}

export async function readData<T>(name: string): Promise<T | null> {
  return (await read<T>(name)).value
}

/** Conditional writes retry against the latest record instead of losing another device's edits. */
export async function updateData<T>(name: string, change: (current: T | null) => T): Promise<T> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const current = await read<T>(name)
    const next = change(current.value)
    try {
      await storageClient().send(new PutObjectCommand({
        Bucket: bucket(), Key: key(name), Body: JSON.stringify(next),
        ContentType: 'application/json', CacheControl: 'private, no-store',
        ...(current.etag ? { IfMatch: current.etag } : { IfNoneMatch: '*' }),
      }))
      return next
    } catch (error) {
      if (status(error) !== 412 && status(error) !== 409) throw error
    }
  }
  throw new Error('记录正在被另一台设备更新，请重试')
}

export async function listData<T>(prefix: string): Promise<T[]> {
  key(prefix)
  const names: string[] = []
  let continuation: string | undefined
  do {
    const result = await storageClient().send(new ListObjectsV2Command({ Bucket: bucket(), Prefix: `data/${prefix}`, ContinuationToken: continuation }))
    for (const object of result.Contents ?? []) {
      if (object.Key?.endsWith('.json')) names.push(object.Key.slice(5, -5))
    }
    continuation = result.IsTruncated ? result.NextContinuationToken : undefined
    if (result.IsTruncated && !continuation) throw new Error('Incomplete storage listing')
  } while (continuation)
  const values: T[] = []
  for (let offset = 0; offset < names.length; offset += 8) {
    for (const value of await Promise.all(names.slice(offset, offset + 8).map((name) => readData<T>(name)))) {
      if (value !== null) values.push(value)
    }
  }
  return values
}
