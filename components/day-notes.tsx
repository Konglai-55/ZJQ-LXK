'use client'

import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { NoteComposer } from '@/components/note-composer'
import { NoteKindIcon } from '@/components/note-kind-icon'
import { NoteViewer } from '@/components/note-viewer'
import { markNoteRead, noteId, useNotes } from '@/hooks/use-notes'
import { getNoteKind } from '@/lib/notes'
import { PARTNERS, otherPartner, type PartnerId } from '@/lib/partners'
import { cn } from '@/lib/utils'

export function DayNotes({ me, date, compact = false }: { me: PartnerId; date: string; compact?: boolean }) {
  const partner = otherPartner(me)
  const notes = useNotes(date.slice(0, 7))
  const received = notes.get(noteId(partner, date))
  const sent = notes.get(noteId(me, date))
  const [viewing, setViewing] = useState(false)
  const [composing, setComposing] = useState(false)
  const unread = Boolean(received && !received.readAt)

  return (
    <div className={compact ? 'flex shrink-0 items-center gap-1' : 'flex flex-wrap items-center gap-2 px-4 pt-3'}>
      {received && (
        <button
          type="button"
          aria-label={`${PARTNERS[partner].name}给你留了${getNoteKind(received.kind).label}${unread ? '，未读' : ''}`}
          onClick={() => {
            setViewing(true)
            if (unread) markNoteRead(date)
          }}
          className={cn(
            'relative flex items-center justify-center gap-1.5 rounded-full border text-sm transition',
            compact ? 'size-10' : 'px-3 py-1.5',
            unread ? 'border-primary bg-primary text-primary-foreground' : 'border-primary/40 text-primary',
          )}
        >
          <NoteKindIcon kind={received.kind} className="size-4" />
          {!compact && <span>{PARTNERS[partner].name}给你留了{getNoteKind(received.kind).label}</span>}
          {unread && <span aria-hidden="true" className={compact ? 'absolute right-1 top-1 size-1.5 rounded-full bg-primary-foreground' : 'size-1.5 rounded-full bg-primary-foreground'} />}
        </button>
      )}

      <button
        type="button"
        aria-label={sent ? '改一改我留的' : `给${PARTNERS[partner].name}留张纸条`}
        onClick={() => setComposing(true)}
        className={cn('flex items-center justify-center gap-1.5 rounded-full border border-dashed border-foreground/30 text-sm transition hover:border-primary hover:text-primary', compact ? 'size-10' : 'px-3 py-1.5')}
      >
        {sent ? <NoteKindIcon kind={sent.kind} className="size-4" /> : <Pencil aria-hidden="true" className="size-4" />}
        {!compact && <span>{sent ? '改一改我留的' : `给${PARTNERS[partner].name}留张纸条`}</span>}
      </button>

      <NoteViewer note={received ?? null} open={viewing} onOpenChange={setViewing} />
      <NoteComposer to={partner} date={date} open={composing} onOpenChange={setComposing} existing={sent} />
    </div>
  )
}
