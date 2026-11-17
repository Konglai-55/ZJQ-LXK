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
        <Dialog.Popup className="fixed inset-x-0 bottom-0 top-4 z-50 flex flex-col overflow-hidden rounded-t-3xl bg-background outline-none transition data-[ending-style]:translate-y-6 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-6 data-[starting-style]:opacity-0 md:inset-x-6 md:bottom-6 md:top-6 md:mx-auto md:max-w-2xl md:rounded-3xl">
          {date && formatted && (
            <>
              <header className="flex items-center justify-between gap-2 border-b border-dashed px-4 py-3 sm:px-6">
                <button
                  type="button"
                  onClick={() => onChangeDate(shiftDateKey(date, -1))}
                  aria-label="前一天"
                  className="flex size-10 items-center justify-center rounded-full transition hover:bg-secondary"
                >
                  <ChevronLeft className="size-5" aria-hidden="true" />
                </button>
                <div className="flex flex-col items-center">
                  <Dialog.Title className="font-hand text-2xl leading-tight sm:text-3xl">{formatted.full}</Dialog.Title>
                  <Dialog.Description className="text-xs tracking-widest text-muted-foreground">
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

              <DayNotes key={date} me={me} date={date} />

              <div className="flex justify-center px-4 pt-4">
                <div role="tablist" aria-label="切换日记本" className="flex rounded-full bg-secondary p-1">
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={viewing === t.id}
                      onClick={() => setViewing(t.id)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-full px-5 py-1.5 font-hand text-xl transition',
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
              </div>

              <div role="tabpanel" className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
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
