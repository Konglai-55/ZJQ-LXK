'use client'

import { Mail, PenLine, StickyNote } from 'lucide-react'
import { useState } from 'react'
import { MoodPicker } from '@/components/mood-picker'
import { MoodFace } from '@/components/mood-face'
import { NoteComposer } from '@/components/note-composer'
import { NoteKindIcon } from '@/components/note-kind-icon'
import { NoteViewer } from '@/components/note-viewer'
import { entryId, saveEntry, useEntries } from '@/hooks/use-entries'
import { markNoteRead, noteId, useNotes, useUnreadNotes, type Note } from '@/hooks/use-notes'
import { getMood } from '@/lib/moods'
import { getNoteKind } from '@/lib/notes'
import { PARTNERS, otherPartner, type PartnerId } from '@/lib/partners'
import { cn } from '@/lib/utils'

type Props = { me: PartnerId; todayKey: string; onOpenDiary: () => void }

export function TodayMood({ me, todayKey, onOpenDiary }: Props) {
  const { entries } = useEntries(todayKey.slice(0, 7))
  const mine = entries.get(entryId(me, todayKey))
  const partnerId = otherPartner(me)
  const theirs = entries.get(entryId(partnerId, todayKey))
  const theirMood = getMood(theirs?.mood)

  const unread = useUnreadNotes()
  const sentToday = useNotes(todayKey.slice(0, 7)).get(noteId(me, todayKey))
  const [viewing, setViewing] = useState<Note | null>(null)
  const [composing, setComposing] = useState(false)
  const partnerSad = theirs?.mood === 'sad'

  return (
    <section
      aria-labelledby="today-mood-title"
      className="paper-shadow flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
    >
      {unread.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setViewing(unread[0])
            markNoteRead(unread[0].date)
          }}
          className="flex items-center gap-3 rounded-xl bg-primary/10 px-3 py-3 text-left text-primary transition active:scale-[0.99]"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Mail className="size-5" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="font-hand text-xl leading-tight">
              {PARTNERS[partnerId].name}留了{getNoteKind(unread[0].kind).label}
            </span>
            <span className="text-xs opacity-80">{unread.length} 张未读，点开看看</span>
          </span>
        </button>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h2 id="today-mood-title" className="font-hand text-2xl leading-none">
            {PARTNERS[me].name}的今天
          </h2>
          <span className="shrink-0 text-[11px] text-muted-foreground">{Number(todayKey.slice(5, 7))}月{Number(todayKey.slice(8))}日</span>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MoodFace mood={theirs?.mood} shape={PARTNERS[partnerId].shape} className="size-5" />
          {PARTNERS[partnerId].name}今天：{theirMood?.label ?? '还没记录'}
        </p>
      </div>

      <MoodPicker
        shape={PARTNERS[me].shape}
        value={mine?.mood ?? null}
        onChange={(mood) => saveEntry(me, todayKey, { mood })}
      />

      <div className="grid grid-cols-[1.2fr_1fr] gap-2 border-t border-dashed pt-3">
        <button
          type="button"
          onClick={onOpenDiary}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-2 text-sm text-primary-foreground transition active:scale-[0.98]"
        >
          <PenLine className="size-4" aria-hidden="true" />
          写今天的日记
        </button>
        <button
          type="button"
          onClick={() => setComposing(true)}
          aria-label={partnerSad ? `给${PARTNERS[partnerId].name}送个抱抱` : sentToday ? '修改今天的小纸条' : `给${PARTNERS[partnerId].name}留张纸条`}
          className={cn(
            'flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-sm transition active:scale-[0.98]',
            partnerSad ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground',
          )}
        >
          {partnerSad ? <NoteKindIcon kind="hug" className="size-4" /> : <StickyNote className="size-4" aria-hidden="true" />}
          {partnerSad
            ? '送个抱抱'
            : sentToday
              ? '改改纸条'
              : '留张纸条'}
        </button>
      </div>

      <NoteViewer note={viewing} open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)} />
      <NoteComposer
        to={partnerId}
        date={todayKey}
        open={composing}
        onOpenChange={setComposing}
        existing={sentToday}
        defaultKind={partnerSad ? 'hug' : 'note'}
      />
    </section>
  )
}
