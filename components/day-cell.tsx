import { Heart, Mail, StickyNote } from 'lucide-react'
import { MoodFace } from '@/components/mood-face'
import type { Entry } from '@/hooks/use-entries'
import { getMood } from '@/lib/moods'
import { PARTNERS } from '@/lib/partners'
import { getSpecialDays } from '@/lib/special-days'
import { cn } from '@/lib/utils'

type Props = {
  date: string
  isToday: boolean
  isFuture: boolean
  xikun?: Entry
  jiaqi?: Entry
  noteMark?: 'unread' | 'got' | 'sent'
  capsuleMark?: 'sealed' | 'ready'
  onSelect: () => void
}

export function DayCell({ date, isToday, isFuture, xikun, jiaqi, noteMark, capsuleMark, onSelect }: Props) {
  const day = Number(date.slice(8))
  const hasDiary = Boolean(xikun?.hasDiary || jiaqi?.hasDiary)
  const specials = getSpecialDays(date)
  const main = specials[0]
  const ours = main?.kind === 'anniversary' || main?.kind === 'hundred'
  const describe = (name: string, e?: Entry) => `${name}${getMood(e?.mood)?.label ?? '未记录'}`
  const label = `${Number(date.slice(5, 7))}月${day}日${specials.length ? `，${specials.map((s) => s.detail).join('，')}` : ''}，${describe(PARTNERS.jiaqi.name, jiaqi)}，${describe(PARTNERS.xikun.name, xikun)}${hasDiary ? '，有日记' : ''}${noteMark === 'unread' ? '，有未读小纸条' : noteMark ? '，有小纸条' : ''}${capsuleMark === 'ready' ? '，有时间胶囊可以拆开' : capsuleMark ? '，这天有时间胶囊开启' : ''}`

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isFuture}
      aria-label={label}
      className={cn(
        'group relative flex min-w-0 flex-col items-center gap-1 rounded-xl border border-transparent py-2 transition',
        'enabled:hover:bg-secondary focus-visible:bg-secondary',
        ours && 'border-dashed border-primary/50 bg-primary/10',
        isFuture && 'cursor-default',
        isFuture && (ours ? 'opacity-80' : 'opacity-35'),
      )}
    >
      {noteMark && (
        <StickyNote
          aria-hidden="true"
          className={cn(
            'absolute left-0.5 top-0.5 size-3.5',
            noteMark === 'unread' ? 'fill-primary/30 text-primary' : 'text-primary/50',
          )}
        />
      )}
      {capsuleMark && (
        <Mail
          aria-hidden="true"
          className={cn('absolute right-0.5 top-0.5 size-3.5', capsuleMark === 'ready' ? 'text-primary' : 'text-muted-foreground')}
        />
      )}
      <span className="relative flex size-8 items-center justify-center">
        {main?.kind === 'anniversary' && (
          <Heart aria-hidden="true" className="absolute size-9 fill-primary text-primary" strokeWidth={1.5} />
        )}
        {main?.kind === 'hundred' && (
          <span aria-hidden="true" className="absolute size-9 rounded-full border-2 border-dashed border-primary">
            <span className="absolute inset-0.5 rounded-full border border-primary/60" />
          </span>
        )}
        <span
          className={cn(
            'relative flex size-8 items-center justify-center rounded-full font-hand text-xl leading-none sm:text-2xl',
            main?.kind === 'anniversary' && 'text-primary-foreground',
            main?.kind === 'hundred' && 'text-primary',
            main?.kind === 'holiday' && 'text-primary',
            isToday && !ours && 'bg-primary text-primary-foreground',
          )}
        >
          {day}
        </span>
        {hasDiary && (
          <span
            aria-hidden="true"
            className="absolute -right-1 top-0 size-1.5 rounded-full bg-primary ring-2 ring-card"
          />
        )}
      </span>
      <span className="flex items-center justify-center gap-0.5">
        <MoodFace
          mood={jiaqi?.mood}
          shape={PARTNERS.jiaqi.shape}
          className="size-5 transition group-enabled:group-hover:-rotate-6"
        />
        <MoodFace
          mood={xikun?.mood}
          shape={PARTNERS.xikun.shape}
          className="size-5 transition group-enabled:group-hover:rotate-6"
        />
      </span>
      {main && (
        <span
          className={cn(
            'max-w-full whitespace-nowrap text-[10px] leading-none',
            ours ? 'font-semibold text-primary' : 'text-primary/80',
          )}
        >
          {main.label}
        </span>
      )}
    </button>
  )
}
