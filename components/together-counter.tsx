import { Heart } from 'lucide-react'
import { HUNDRED_DAYS, dateOfDay, daysTogether } from '@/lib/special-days'

export function TogetherCounter({ todayKey }: { todayKey: string }) {
  const n = daysTogether(todayKey)
  if (n === null) return null

  const left = HUNDRED_DAYS - n
  const hundred = dateOfDay(HUNDRED_DAYS)
  const hundredLabel = `${Number(hundred.slice(5, 7))}月${Number(hundred.slice(8))}日`

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
      <span className="flex items-center gap-1 text-primary">
        <Heart aria-hidden="true" className="size-3 fill-primary" />
        在一起第 {n} 天
      </span>
      {left > 0 && (
        <span className="text-muted-foreground" title={`第 ${HUNDRED_DAYS} 天是${hundredLabel}`}>
          距百天还有 {left} 天
        </span>
      )}
      {left === 0 && <span className="text-xs text-primary">今天就是第 {HUNDRED_DAYS} 天</span>}
    </p>
  )
}
