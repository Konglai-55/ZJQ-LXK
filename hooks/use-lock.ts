'use client'

import useSWR from 'swr'
import { revalidateAllEntries } from '@/hooks/use-entries'

type LockStatus = { mine: boolean; theirs: boolean; canReadTheirs: boolean }

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('加载失败')
  return (await res.json()) as LockStatus
}

async function send(method: 'POST' | 'DELETE', url: string, password?: string) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: password === undefined ? undefined : JSON.stringify({ password }),
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new Error(data.error ?? '出错了，再试一次')
}

export function useLock() {
  const { data, mutate } = useSWR('/api/lock', fetcher)

  return {
    status: data,
    async setPassword(password: string) {
      await send('POST', '/api/lock', password)
      await mutate()
    },
    async removePassword() {
      await send('DELETE', '/api/lock')
      await mutate()
    },
    async unlock(password: string) {
      await send('POST', '/api/lock/unlock', password)
      await mutate()
      await revalidateAllEntries()
    },
  }
}
