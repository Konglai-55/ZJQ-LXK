'use client'

import useSWR, { mutate } from 'swr'
import type { CapsuleTarget } from '@/lib/capsules'
import type { PartnerId } from '@/lib/partners'

export type Capsule = {
  id: number
  author: PartnerId
  to: CapsuleTarget
  openDate: string
  title: string
  createdAt: string
  openedAt: string | null
  sealed: boolean
  mine: boolean
  forMe: boolean
  content: string
}

const KEY = '/api/capsules'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('加载失败')
  return (await res.json()) as { capsules: Capsule[]; today: string }
}

export function useCapsules() {
  const { data, isLoading } = useSWR(KEY, fetcher)
  return { capsules: data?.capsules ?? [], today: data?.today, isLoading }
}

export async function createCapsule(input: {
  to: CapsuleTarget
  openDate: string
  title: string
  content: string
}) {
  const res = await fetch(KEY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new Error(data.error ?? '没封存成功，再试一次')
  await mutate(KEY)
}

export async function deleteCapsule(id: number) {
  const res = await fetch(`${KEY}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('没收回来')
  await mutate(KEY)
}

export async function openCapsule(id: number) {
  await fetch(`${KEY}/${id}/open`, { method: 'POST' })
  await mutate(KEY)
}

export type { PartnerId }
