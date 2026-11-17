'use client'

import { useState } from 'react'
import { PaperDialog } from '@/components/paper-dialog'
import { createCapsule } from '@/hooks/use-capsules'
import { formatDateZh, shiftDateKey } from '@/lib/calendar'
import {
  CAPSULE_TARGETS,
  MAX_CAPSULE_CONTENT,
  MAX_CAPSULE_TITLE,
  type CapsuleTarget,
} from '@/lib/capsules'
import { HUNDRED_DAYS, dateOfDay, nextAnniversary } from '@/lib/special-days'
import { cn } from '@/lib/utils'

type Props = { todayKey: string; open: boolean; onOpenChange: (open: boolean) => void }

export function CapsuleComposer({ todayKey, open, onOpenChange }: Props) {
  return (
    <PaperDialog
      open={open}
      onOpenChange={onOpenChange}
      title="写一封时间胶囊"
      description="封存之后，谁也看不到内容，要等到你选的那一天才能拆开。"
      className="w-[min(94vw,28rem)]"
    >
      <CapsuleForm todayKey={todayKey} onDone={() => onOpenChange(false)} />
    </PaperDialog>
  )
}

function CapsuleForm({ todayKey, onDone }: { todayKey: string; onDone: () => void }) {
  const tomorrow = shiftDateKey(todayKey, 1)
  const hundred = dateOfDay(HUNDRED_DAYS)
  const anniversary = nextAnniversary(todayKey)
  const quick = [
    ...(hundred > todayKey ? [{ label: `第 ${HUNDRED_DAYS} 天`, date: hundred }] : []),
    { label: `${anniversary.years} 周年`, date: anniversary.date },
  ]

  const [to, setTo] = useState<CapsuleTarget>('partner')
  const [openDate, setOpenDate] = useState(quick[0].date)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      await createCapsule({ to, openDate, title: title.trim(), content: content.trim() })
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : '出错了')
    }
    setPending(false)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div role="radiogroup" aria-label="写给谁" className="flex flex-wrap gap-2">
        {CAPSULE_TARGETS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={to === t.id}
            onClick={() => setTo(t.id)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 font-hand text-lg leading-tight transition',
              to === t.id ? 'border-primary bg-primary text-primary-foreground' : 'border-dashed border-foreground/30',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs text-muted-foreground">哪一天拆开</legend>
        <div className="flex flex-wrap gap-2">
          {quick.map((q) => (
            <button
              key={q.date}
              type="button"
              aria-pressed={openDate === q.date}
              onClick={() => setOpenDate(q.date)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm transition',
                openDate === q.date ? 'border-primary bg-primary/10 text-primary' : 'border-dashed border-foreground/30',
              )}
            >
              {q.label}
              <span className="ml-1.5 text-xs opacity-70">{formatDateZh(q.date).full}</span>
            </button>
          ))}
        </div>
        <label className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">或者自己选</span>
          <input
            type="date"
            min={tomorrow}
            value={openDate}
            onChange={(e) => e.target.value && setOpenDate(e.target.value)}
            className="min-w-0 flex-1 border-b-2 border-border bg-transparent py-1 outline-none focus:border-primary"
          />
        </label>
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">信封上的名字（可不写）</span>
        <input
          value={title}
          maxLength={MAX_CAPSULE_TITLE}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="比如：给一百天的我们"
          className="border-b-2 border-border bg-transparent py-1.5 font-hand text-xl outline-none placeholder:text-muted-foreground/60 focus:border-primary"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="sr-only">信的内容</span>
        <textarea
          value={content}
          maxLength={MAX_CAPSULE_CONTENT}
          onChange={(e) => setContent(e.target.value)}
          rows={7}
          placeholder="写给那一天的你……"
          className="paper-lined h-63 w-full resize-none rounded-sm pl-12 pr-3 font-hand text-xl leading-9 outline-none placeholder:text-muted-foreground/60"
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !content.trim() || openDate <= todayKey}
        className="rounded-full bg-primary px-6 py-2.5 font-hand text-2xl text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
      >
        {pending ? '封存中…' : `封存，${formatDateZh(openDate).full}拆开`}
      </button>
    </form>
  )
}
