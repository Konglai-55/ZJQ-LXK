'use client'

import type { ImgHTMLAttributes } from 'react'
import useSWR from 'swr'

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error('图片暂时无法读取')
  return response.json() as Promise<{ url: string }>
}

export function StorageImage({ pathname, alt, ...props }: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'crossOrigin'> & { pathname: string }) {
  const { data, error } = useSWR(`/api/file?pathname=${encodeURIComponent(pathname)}`, fetcher, { refreshInterval: 240000, dedupingInterval: 30000 })
  return <img {...props} src={data?.url} crossOrigin="anonymous" alt={error ? `${alt ?? '照片'}（暂时无法加载）` : alt} />
}
