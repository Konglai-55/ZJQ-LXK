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

export function DayNotes({ me, date }: { me: PartnerId; date: string }) {
  const partner = otherPartner(me)
  const notes = useNotes(date.slice(0, 7))
  const received = notes.get(noteId(partner, date))
  const sent = notes.get(noteId(me, date))
  const [viewing, setViewing] = useState(false)
  const [composing, setComposing] = useState(false)
  const unread = Boolean(received && !received.readAt)

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
      {received && (
        <button
          type="button"
          onClick={() => {
            setViewing(true)
            if (unread) markNoteRead(date)
          }}
          className={cn(
            'relative flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition',
            unread ? 'border-primary bg-primary text-primary-foreground' : 'border-primary/40 text-primary',
          )}
        >
          <NoteKindIcon kind={received.kind} className="size-4" />
          {PARTNERS[partner].name}给你留了{getNoteKind(received.kind).label}
          {unread && <span aria-hidden="true" className="size-1.5 rounded-full bg-primary-foreground" />}
        </button>
      )}

      <button
        type="button"
        onClick={() => setComposing(true)}
        className="flex items-center gap-1.5 rounded-full border border-dashed border-foreground/30 px-3 py-1.5 text-sm transition hover:border-primary hover:text-primary"
      >
        {sent ? <NoteKindIcon kind={sent.kind} className="size-4" /> : <Pencil aria-hidden="true" className="size-4" />}
        {sent ? '改一改我留的' : `给${PARTNERS[partner].name}留张纸条`}
      </button>

      <NoteViewer note={received ?? null} open={viewing} onOpenChange={setViewing} />
      <NoteComposer to={partner} date={date} open={composing} onOpenChange={setComposing} existing={sent} />
    </div>
  )
}
