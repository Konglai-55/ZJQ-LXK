'use client'

import { ArrowLeftRight, Mail, StickyNote } from 'lucide-react'
import { useState } from 'react'
import { switchPartner } from '@/app/actions/identity'
import { TogetherCounter } from '@/components/together-counter'
import { PhotoWall } from '@/components/photo-wall'
import { CalendarHeader } from '@/components/calendar-header'
import { CapsuleBox } from '@/components/capsule-box'
import { DayCell } from '@/components/day-cell'
import { DiaryDialog } from '@/components/diary-dialog'
import { HomeShortcuts } from '@/components/home-shortcuts'
import { MonthRecap } from '@/components/month-recap'
import { MonthSpecials } from '@/components/month-specials'
import { TodayMood } from '@/components/today-mood'
import { MoodFace } from '@/components/mood-face'
import { useCapsules } from '@/hooks/use-capsules'
import { useEntries, entryId } from '@/hooks/use-entries'
import { noteId, useNotes } from '@/hooks/use-notes'
import { buildMonthGrid, toDateKey, toMonthKey, MONTH_NAMES, WEEKDAYS } from '@/lib/calendar'
import { PARTNERS, PARTNER_ORDER, otherPartner, type PartnerId } from '@/lib/partners'

export function LoveCalendar({ me }: { me: PartnerId }) {
  const now = new Date()
  const todayKey = toDateKey(now)
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [selected, setSelected] = useState<string | null>(null)

  const [capsulesOpen, setCapsulesOpen] = useState(false)
  const [recapOpen, setRecapOpen] = useState(false)
  const [photosOpen, setPhotosOpen] = useState(false)

  const monthKey = toMonthKey(view.year, view.month)
  const { entries, isLoading } = useEntries(monthKey)
  const notes = useNotes(monthKey)
  const { capsules } = useCapsules()
  const cells = buildMonthGrid(view.year, view.month)
  const partner = otherPartner(me)

  function noteMarkFor(date: string): 'unread' | 'got' | 'sent' | undefined {
    const got = notes.get(noteId(partner, date))
    if (got) return got.readAt ? 'got' : 'unread'
    return notes.has(noteId(me, date)) ? 'sent' : undefined
  }

  function capsuleMarkFor(date: string): 'sealed' | 'ready' | undefined {
    const due = capsules.filter((c) => c.openDate === date)
    if (due.some((c) => !c.sealed && c.forMe && !c.openedAt)) return 'ready'
    return due.some((c) => c.sealed) ? 'sealed' : undefined
  }

  function shiftMonth(delta: number) {
    setView(({ year, month }) => {
      const d = new Date(year, month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  function openDate(date: string) {
    const [y, m] = date.split('-').map(Number)
    if (y !== view.year || m - 1 !== view.month) setView({ year: y, month: m - 1 })
    setSelected(date)
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-5 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="flex items-center gap-2 whitespace-nowrap font-hand text-[24px] leading-none"><img src="/icon.svg?v=2" alt="" className="size-8" />梁熙坤 <span className="text-primary">&amp;</span> 祝佳琪</h1>
          <TogetherCounter todayKey={todayKey} />
        </div>
        <form action={switchPartner}>
          <button type="submit" aria-label={`当前是${PARTNERS[me].name}，切换身份`} title="切换身份" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:bg-secondary">
            <ArrowLeftRight className="size-4" aria-hidden="true" />
          </button>
        </form>
      </header>

      <TodayMood me={me} todayKey={todayKey} onOpenDiary={() => openDate(todayKey)} />

      <section id="calendar" aria-label="心情日历" className="scroll-mt-5">
        <CalendarHeader
          year={view.year}
          month={view.month}
          onPrev={() => shiftMonth(-1)}
          onNext={() => shiftMonth(1)}
          onToday={() => setView({ year: now.getFullYear(), month: now.getMonth() })}
        />
        <div className="grid grid-cols-7 pb-3" aria-hidden="true">
          {WEEKDAYS.map((w) => (
            <span key={w} className="text-center text-xs tracking-widest text-muted-foreground">
              {w}
            </span>
          ))}
        </div>
        <div className={isLoading ? 'grid grid-cols-7 gap-y-2 opacity-60 transition' : 'grid grid-cols-7 gap-y-2 transition'}>
          {cells.map((date, i) =>
            date ? (
              <DayCell
                key={date}
                date={date}
                isToday={date === todayKey}
                isFuture={date > todayKey}
                xikun={entries.get(entryId('xikun', date))}
                jiaqi={entries.get(entryId('jiaqi', date))}
                noteMark={noteMarkFor(date)}
                capsuleMark={capsuleMarkFor(date)}
                onSelect={() => setSelected(date)}
              />
            ) : (
              <span key={`pad-${i}`} aria-hidden="true" />
            ),
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-dashed pt-3 text-[11px] text-muted-foreground">
          {PARTNER_ORDER.map((id) => (
            <span key={id} className="flex items-center gap-2">
              <MoodFace mood="calm" shape={PARTNERS[id].shape} className="size-5" />
              {PARTNERS[id].name}
            </span>
          ))}
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
            写了日记
          </span>
          <span className="flex items-center gap-1.5">
            <StickyNote className="size-3.5 text-primary" aria-hidden="true" />
            小纸条
          </span>
          <span className="flex items-center gap-1.5">
            <Mail className="size-3.5 text-primary" aria-hidden="true" />
            胶囊开启日
          </span>
        </div>

        <MonthSpecials dates={cells} />
      </section>

      <HomeShortcuts
        monthName={MONTH_NAMES[view.month]}
        onOpenCapsules={() => setCapsulesOpen(true)}
        onOpenRecap={() => setRecapOpen(true)}
        onOpenPhotos={() => setPhotosOpen(true)}
      />

      <DiaryDialog
        me={me}
        date={selected}
        todayKey={todayKey}
        entries={entries}
        onChangeDate={openDate}
        onClose={() => setSelected(null)}
      />

      <CapsuleBox todayKey={todayKey} open={capsulesOpen} onOpenChange={setCapsulesOpen} />
      <PhotoWall me={me} open={photosOpen} onOpenChange={setPhotosOpen} />
      <MonthRecap
        year={view.year}
        month={view.month}
        todayKey={todayKey}
        cells={cells}
        entries={entries}
        open={recapOpen}
        onOpenChange={setRecapOpen}
      />
    </main>
  )
}
