'use client'

import { Lock } from 'lucide-react'
import { startTransition, useActionState, useState } from 'react'
import { choosePartner, type ChooseState } from '@/app/actions/identity'
import { MoodFace } from '@/components/mood-face'
import { PARTNERS, PARTNER_ORDER, type PartnerId } from '@/lib/partners'
import { cn } from '@/lib/utils'

export function ChooseForm({ locked }: { locked: Record<PartnerId, boolean> }) {
  const [state, action, pending] = useActionState<ChooseState, FormData>(choosePartner, null)
  const [selected, setSelected] = useState<PartnerId | null>(null)

  function pick(id: PartnerId) {
    if (locked[id]) {
      setSelected(id)
      return
    }
    const fd = new FormData()
    fd.set('partner', id)
    startTransition(() => action(fd))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        {PARTNER_ORDER.map((id) => {
          const p = PARTNERS[id]
          const active = selected === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => pick(id)}
              disabled={pending}
              aria-pressed={active}
              className={cn(
                'group relative flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed bg-card px-3 py-6 transition hover:border-primary hover:bg-secondary',
                active ? 'border-primary bg-secondary' : 'border-border',
              )}
            >
              {locked[id] && (
                <Lock className="absolute right-3 top-3 size-4 text-primary" aria-label="已上锁" />
              )}
              <MoodFace
                mood={p.shape === 'circle' ? 'love' : 'happy'}
                shape={p.shape}
                className="size-20 transition group-hover:-rotate-6 group-hover:scale-105"
              />
              <span className="font-hand text-3xl">{p.name}</span>
            </button>
          )
        })}
      </div>

      {selected && locked[selected] && (
        <form action={action} className="flex flex-col items-center gap-3">
          <input type="hidden" name="partner" value={selected} />
          <label htmlFor="enter-password" className="font-hand text-xl">
            {PARTNERS[selected].name}，输入你的密码
          </label>
          <input
            id="enter-password"
            name="password"
            type="password"
            autoFocus
            autoComplete="current-password"
            className="w-48 border-b-2 border-foreground/30 bg-transparent py-1.5 text-center text-lg tracking-[0.4em] outline-none transition focus:border-primary"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-primary px-6 py-2 font-hand text-xl text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {pending ? '开锁中…' : '进入'}
          </button>
        </form>
      )}

      {state?.error && (
        <p role="alert" className="text-center text-sm text-destructive">
          {state.error}
        </p>
      )}
    </div>
  )
}
