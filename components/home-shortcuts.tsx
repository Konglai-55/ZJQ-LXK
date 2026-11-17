'use client'

import { BookHeart, CalendarDays, Images, Mail } from 'lucide-react'
import { useCapsules } from '@/hooks/use-capsules'

type Props = {
  monthName: string
  onOpenCapsules: () => void
  onOpenRecap: () => void
  onOpenPhotos: () => void
}

export function HomeShortcuts({ monthName, onOpenCapsules, onOpenRecap, onOpenPhotos }: Props) {
  const { capsules } = useCapsules()
  const ready = capsules.filter((c) => !c.sealed && c.forMe && !c.openedAt).length

  return (
    <nav aria-label="主页导航" className="fixed inset-x-0 bottom-0 z-30 mx-auto grid w-full max-w-md grid-cols-4 border-t border-border bg-background/95 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-lg">
      <a href="#calendar" aria-current="location" className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-primary">
        <CalendarDays className="size-5" aria-hidden="true" />
        <span className="text-xs">日历</span>
      </a>
      <button type="button" onClick={onOpenPhotos} className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-muted-foreground hover:bg-secondary">
        <Images className="size-5" aria-hidden="true" />
        <span className="text-xs">合照墙</span>
      </button>
      <button type="button" onClick={onOpenCapsules} aria-label={ready ? `时间胶囊，${ready}封可以拆开` : '时间胶囊'} className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-muted-foreground hover:bg-secondary">
        <span className="relative">
          <Mail className="size-5" aria-hidden="true" />
          {ready > 0 && <span className="absolute -right-1 -top-0.5 size-2 rounded-full bg-primary ring-2 ring-background" />}
        </span>
        <span className="text-xs">时间胶囊{ready > 0 ? ` · ${ready}` : ''}</span>
      </button>
      <button type="button" onClick={onOpenRecap} aria-label={`打开${monthName}手账`} className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-muted-foreground hover:bg-secondary">
        <BookHeart className="size-5" aria-hidden="true" />
        <span className="text-xs">月度手账</span>
      </button>
    </nav>
  )
}
