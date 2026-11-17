'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MONTH_NAMES } from '@/lib/calendar'

type Props = {
  year: number
  month: number
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

export function CalendarHeader({ year, month, onPrev, onNext, onToday }: Props) {
  return (
    <header className="mb-4 flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-baseline gap-2">
        <h2 className="whitespace-nowrap font-hand text-3xl leading-none">{MONTH_NAMES[month]}</h2>
        <span className="text-xs text-muted-foreground">{year}</span>
      </div>
      <nav aria-label="切换月份" className="flex shrink-0 items-center">
        <button type="button" onClick={onPrev} aria-label="上个月" className="flex size-11 items-center justify-center rounded-full hover:bg-secondary">
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <button type="button" onClick={onToday} className="min-h-11 whitespace-nowrap px-2 text-sm text-primary">今天</button>
        <button type="button" onClick={onNext} aria-label="下个月" className="flex size-11 items-center justify-center rounded-full hover:bg-secondary">
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </nav>
    </header>
  )
}
