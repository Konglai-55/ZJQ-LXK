'use client'

import { Dialog } from '@base-ui/react/dialog'
import { ChevronLeft, ChevronRight, Lock, X } from 'lucide-react'
import { useState } from 'react'
import { DayNotes } from '@/components/day-notes'
import { DiaryPage } from '@/components/diary-page'
import { entryId, type Entry } from '@/hooks/use-entries'
import { useLock } from '@/hooks/use-lock'
import { formatDateZh, shiftDateKey } from '@/lib/calendar'
import { PARTNERS, otherPartner, type PartnerId } from '@/lib/partners'
import { getSpecialDays } from '@/lib/special-days'
import { cn } from '@/lib/utils'

type Props = {
  me: PartnerId
  date: string | null
  todayKey: string
  entries: Map<string, Entry>
  onChangeDate: (date: string) => void
  onClose: () => void
}

export function DiaryDialog({ me, date, todayKey, entries, onChangeDate, onClose }: Props) {
  const [viewing, setViewing] = useState<PartnerId>(me)
  const { status } = useLock()
  const partner = otherPartner(me)
  const formatted = date ? formatDateZh(date) : null
  const canGoNext = date ? shiftDateKey(date, 1) <= todayKey : false

  const tabs: { id: PartnerId; label: string }[] = [
    { id: me, label: '我的日记' },
    { id: partner, label: `${PARTNERS[partner].name}的日记` },
  ]

  return (
    <Dialog.Root
      open={date !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
          setViewing(me)
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-[2px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-paper pt-[env(safe-area-inset-top)] outline-none transition data-[ending-style]:translate-y-6 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-6 data-[starting-style]:opacity-0 md:inset-6 md:mx-auto md:max-w-2xl md:rounded-3xl">
          {date && formatted && (
            <>
              <header className="flex shrink-0 items-center justify-between gap-1 border-b border-dashed px-2 py-1">
                <button
                  type="button"
                  onClick={() => onChangeDate(shiftDateKey(date, -1))}
                  aria-label="前一天"
                  className="flex size-10 items-center justify-center rounded-full transition hover:bg-secondary"
                >
                  <ChevronLeft className="size-5" aria-hidden="true" />
                </button>
                <div className="flex min-w-0 flex-1 items-baseline justify-center gap-2">
                  <Dialog.Title className="whitespace-nowrap font-hand text-xl leading-tight">{formatted.full}</Dialog.Title>
                  <Dialog.Description className="sr-only">
                    {[formatted.weekday, ...getSpecialDays(date).map((s) => s.detail)].join(' · ')}
                  </Dialog.Description>
                </div>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => onChangeDate(shiftDateKey(date, 1))}
                    disabled={!canGoNext}
                    aria-label="后一天"
                    className="flex size-10 items-center justify-center rounded-full transition hover:bg-secondary disabled:opacity-30"
                  >
                    <ChevronRight className="size-5" aria-hidden="true" />
                  </button>
                  <Dialog.Close
                    aria-label="关闭"
                    className="flex size-10 items-center justify-center rounded-full transition hover:bg-secondary"
                  >
                    <X className="size-5" aria-hidden="true" />
                  </Dialog.Close>
                </div>
              </header>

              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-dashed px-3 py-1">
                <div role="tablist" aria-label="切换日记本" className="flex min-w-0 items-center gap-1">
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={viewing === t.id}
                      onClick={() => setViewing(t.id)}
                      className={cn(
                        'flex min-h-10 items-center gap-1 rounded-full px-3 text-sm transition',
                        viewing === t.id ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {t.id !== me && status?.theirs && !status.canReadTheirs && (
                        <Lock className="size-3.5" aria-label="已上锁" />
                      )}
                      {t.label}
                    </button>
                  ))}
                </div>
                <DayNotes key={date} me={me} date={date} compact />
              </div>

              <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
                <DiaryPage
                  key={`${viewing}-${date}`}
                  me={me}
                  owner={viewing}
                  date={date}
                  entry={entries.get(entryId(viewing, date))}
                />
              </div>
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
