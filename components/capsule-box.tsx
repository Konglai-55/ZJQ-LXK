'use client'

import { Dialog } from '@base-ui/react/dialog'
import { Heart, Mail, MailOpen, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { CapsuleComposer } from '@/components/capsule-composer'
import { CapsuleReader } from '@/components/capsule-reader'
import { deleteCapsule, openCapsule, useCapsules, type Capsule } from '@/hooks/use-capsules'
import { formatDateZh } from '@/lib/calendar'
import { CAPSULE_TARGETS } from '@/lib/capsules'
import { PARTNERS, otherPartner } from '@/lib/partners'
import { diffDays } from '@/lib/special-days'
import { cn } from '@/lib/utils'

type Props = { todayKey: string; open: boolean; onOpenChange: (open: boolean) => void }

export function CapsuleBox({ todayKey, open, onOpenChange }: Props) {
  const { capsules, isLoading } = useCapsules()
  const [composing, setComposing] = useState(false)
  const [reading, setReading] = useState<Capsule | null>(null)

  const ready = capsules.filter((c) => !c.sealed && c.forMe && !c.openedAt)
  const sealed = capsules.filter((c) => c.sealed)
  const opened = capsules.filter((c) => !c.sealed && !ready.includes(c)).reverse()

  function read(c: Capsule) {
    setReading(c)
    if (c.forMe && !c.openedAt) openCapsule(c.id)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-[2px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-x-0 bottom-0 top-4 z-50 flex flex-col overflow-hidden rounded-t-3xl bg-background outline-none transition data-[ending-style]:translate-y-6 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-6 data-[starting-style]:opacity-0 md:inset-x-6 md:bottom-6 md:top-6 md:mx-auto md:max-w-2xl md:rounded-3xl">
          <header className="flex items-center justify-between gap-2 border-b border-dashed px-5 py-3">
            <div className="flex flex-col">
              <Dialog.Title className="font-hand text-3xl leading-tight">时间胶囊</Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground">写给未来的信，到了日子才能拆开</Dialog.Description>
            </div>
            <Dialog.Close aria-label="关闭" className="flex size-10 items-center justify-center rounded-full hover:bg-secondary">
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </header>

          <div className="flex flex-1 flex-col gap-7 overflow-y-auto px-4 py-5">
            <button
              type="button"
              onClick={() => setComposing(true)}
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 py-4 font-hand text-2xl text-primary transition active:scale-[0.99]"
            >
              <Plus className="size-5" aria-hidden="true" />
              写一封新的
            </button>

            {ready.length > 0 && (
              <Group title="可以拆开了">
                {ready.map((c) => (
                  <Envelope key={c.id} capsule={c} todayKey={todayKey} onOpen={() => read(c)} />
                ))}
              </Group>
            )}

            <Group title="封存中" empty={sealed.length === 0 && !isLoading ? '还没有封存的信，写一封给未来的我们吧' : undefined}>
              {sealed.map((c) => (
                <Envelope key={c.id} capsule={c} todayKey={todayKey} />
              ))}
            </Group>

            {opened.length > 0 && (
              <Group title="已经拆开">
                {opened.map((c) => (
                  <Envelope key={c.id} capsule={c} todayKey={todayKey} onOpen={() => read(c)} />
                ))}
              </Group>
            )}
          </div>

          <CapsuleComposer todayKey={todayKey} open={composing} onOpenChange={setComposing} />
          <CapsuleReader capsule={reading} open={reading !== null} onOpenChange={(o) => !o && setReading(null)} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Group({ title, empty, children }: { title: string; empty?: string; children?: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-hand text-2xl">{title}</h3>
      {empty ? <p className="text-sm text-muted-foreground">{empty}</p> : <div className="flex flex-col gap-4">{children}</div>}
    </section>
  )
}

function Envelope({ capsule: c, todayKey, onOpen }: { capsule: Capsule; todayKey: string; onOpen?: () => void }) {
  const left = diffDays(todayKey, c.openDate)
  const target = CAPSULE_TARGETS.find((t) => t.id === c.to)
  const from = c.mine ? '我' : PARTNERS[c.author].name
  const clickable = Boolean(onOpen)
  const isReady = !c.sealed && c.forMe && !c.openedAt
  const [error, setError] = useState<string | null>(null)

  const Body = (
    <>
      <span
        className={cn(
          'flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-dashed',
          c.sealed ? 'border-primary/50 bg-primary/10 text-primary' : 'border-foreground/30 text-foreground',
          isReady && 'border-primary bg-primary text-primary-foreground',
        )}
      >
        {c.sealed ? <Heart aria-hidden="true" className="size-6 fill-primary" /> : isReady ? <Mail aria-hidden="true" className="size-6" /> : <MailOpen aria-hidden="true" className="size-6" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <span className="truncate font-hand text-2xl leading-tight">{c.title || '一封时间胶囊'}</span>
        <span className="text-xs text-muted-foreground">
          {from}封存 · {c.to === 'partner' ? (c.mine ? `写给${PARTNERS[otherPartner(c.author)].name}` : '写给你') : target?.label}
        </span>
        <span className={cn('text-sm', c.sealed ? 'text-primary' : 'text-muted-foreground')}>
          {c.sealed
            ? `${formatDateZh(c.openDate).full}拆开，还有 ${left} 天`
            : isReady
              ? '到日子了，点开拆信'
              : `${formatDateZh(c.openDate).full}开启`}
        </span>
      </span>
    </>
  )

  return (
    <div className="paper-grain paper-shadow relative rounded-sm bg-paper">
      <div aria-hidden="true" className="absolute -top-2 right-6 h-5 w-16 rotate-3 bg-tape" />
      {clickable ? (
        <button type="button" onClick={onOpen} className="flex w-full items-center gap-4 px-4 py-4">
          {Body}
        </button>
      ) : (
        <div className="flex items-center gap-4 px-4 py-4">{Body}</div>
      )}
      {c.sealed && c.mine && (
        <div className="flex items-center justify-between border-t border-dashed px-4 py-2">
          <span className="text-xs text-muted-foreground">信的内容已经封好了，连你自己也看不到</span>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('确定把这封信撕掉吗？撕掉就找不回来了。')) {
                deleteCapsule(c.id).catch(() => setError('没撕掉，再试一次'))
              }
            }}
            className="text-xs text-muted-foreground underline-offset-4 hover:text-destructive hover:underline"
          >
            撕掉
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="px-4 pb-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
