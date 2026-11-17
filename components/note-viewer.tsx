'use client'

import { NoteKindIcon } from '@/components/note-kind-icon'
import { PaperDialog } from '@/components/paper-dialog'
import type { Note } from '@/hooks/use-notes'
import { formatDateZh } from '@/lib/calendar'
import { getNoteKind } from '@/lib/notes'
import { PARTNERS } from '@/lib/partners'

type Props = {
  note: Note | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NoteViewer({ note, open, onOpenChange }: Props) {
  if (!note) return null
  const kind = getNoteKind(note.kind)
  const sender = PARTNERS[note.from].name

  return (
    <PaperDialog open={open} onOpenChange={onOpenChange} title={`${sender}留给你的`} description={formatDateZh(note.date).full}>
      <div className="paper-grain paper-shadow relative -rotate-1 rounded-sm bg-paper px-5 pb-6 pt-9">
        <div aria-hidden="true" className="absolute -top-2.5 left-1/2 h-6 w-20 -translate-x-1/2 rotate-2 bg-tape" />
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-16 items-center justify-center rounded-full border-2 border-dashed border-primary bg-card text-primary">
            <NoteKindIcon kind={note.kind} className="size-8" />
          </span>
          <p className="font-hand text-3xl text-primary">{kind.label}</p>
          {note.kind !== 'note' && <p className="text-sm text-muted-foreground">{kind.hint}</p>}
          {note.content && (
            <p className="whitespace-pre-wrap break-words font-hand text-2xl leading-9 text-foreground">{note.content}</p>
          )}
        </div>
      </div>
    </PaperDialog>
  )
}
