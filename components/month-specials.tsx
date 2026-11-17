import { cn } from '@/lib/utils'
import { getSpecialDays } from '@/lib/special-days'

export function MonthSpecials({ dates }: { dates: (string | null)[] }) {
  const items = dates.flatMap((date) =>
    date ? getSpecialDays(date).map((s) => ({ date, ...s })) : [],
  )
  if (items.length === 0) return null

  return (
    <ul aria-label="这个月的特别日子" className="mt-4 flex flex-col gap-2 border-t border-dashed px-3 pt-4">
      {items.map((s) => (
        <li key={`${s.date}-${s.kind}-${s.label}`} className="flex items-baseline gap-3">
          <span className="w-16 shrink-0 font-hand text-xl">
            {Number(s.date.slice(5, 7))}月{Number(s.date.slice(8))}日
          </span>
          <span className={cn('text-sm', s.kind === 'holiday' ? 'text-muted-foreground' : 'font-semibold text-primary')}>
            {s.detail}
          </span>
        </li>
      ))}
    </ul>
  )
}
