'use client'

import { useState } from 'react'
import { NoteKindIcon } from '@/components/note-kind-icon'
import { PaperDialog } from '@/components/paper-dialog'
import { removeNote, sendNote, type Note } from '@/hooks/use-notes'
import { MAX_NOTE_LENGTH, NOTE_KINDS, getNoteKind, type NoteKind } from '@/lib/notes'
import { PARTNERS, type PartnerId } from '@/lib/partners'
import { cn } from '@/lib/utils'

type Props = {
  to: PartnerId
  date: string
  open: boolean
  onOpenChange: (open: boolean) => void
  existing?: Note
  defaultKind?: NoteKind
}

export function NoteComposer({ to, date, open, onOpenChange, existing, defaultKind }: Props) {
  const name = PARTNERS[to].name
  return (
    <PaperDialog
      open={open}
      onOpenChange={onOpenChange}
      title={existing ? `改一改给${name}的` : `给${name}留点什么`}
      description="对方打开日历就会看到，点开才能读。"
    >
      <ComposerForm
        date={date}
        existing={existing}
        defaultKind={defaultKind}
        onDone={() => onOpenChange(false)}
      />
    </PaperDialog>
  )
}

function ComposerForm({
  date,
  existing,
  defaultKind,
  onDone,
}: {
  date: string
  existing?: Note
  defaultKind?: NoteKind
  onDone: () => void
}) {
  const [kind, setKind] = useState<NoteKind>(existing?.kind ?? defaultKind ?? 'note')
  const [content, setContent] = useState(existing?.content ?? '')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const current = getNoteKind(kind)
  const needsText = kind === 'note'

  async function run(action: () => Promise<void>) {
    setPending(true)
    setError(null)
    try {
      await action()
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : '出错了')
    }
    setPending(false)
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        run(() => sendNote(date, kind, content.trim()))
      }}
    >
      <div role="radiogroup" aria-label="选一种" className="grid grid-cols-4 gap-2">
        {NOTE_KINDS.map((k) => {
          const selected = kind === k.id
          return (
            <button
              key={k.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setKind(k.id)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 transition',
                selected ? 'border-primary bg-primary/10 text-primary' : 'border-dashed border-border text-muted-foreground',
              )}
            >
              <NoteKindIcon kind={k.id} className="size-6" />
              <span className="font-hand text-lg leading-none">{k.label}</span>
            </button>
          )
        })}
      </div>

      <label className="sr-only" htmlFor="note-content">
        {current.hint}
      </label>
      <textarea
        id="note-content"
        value={content}
        maxLength={MAX_NOTE_LENGTH}
        rows={3}
        autoFocus={needsText}
        onChange={(e) => setContent(e.target.value)}
        placeholder={needsText ? current.hint : `${current.hint}（也可以再写一句）`}
        className="paper-lined h-27 w-full resize-none rounded-sm pl-12 pr-3 font-hand text-xl leading-9 outline-none placeholder:text-muted-foreground/60"
      />

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        {existing ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => removeNote(date))}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-destructive hover:underline disabled:opacity-40"
          >
            收回
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">
            {content.length}/{MAX_NOTE_LENGTH}
          </span>
        )}
        <button
          type="submit"
          disabled={pending || (needsText && !content.trim())}
          className="rounded-full bg-primary px-6 py-2 font-hand text-xl text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
        >
          {pending ? '送出中…' : existing ? '改好了' : '送出'}
        </button>
      </div>
    </form>
  )
}
