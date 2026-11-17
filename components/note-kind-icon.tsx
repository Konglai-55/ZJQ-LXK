import { Cookie, Hand, HeartHandshake, StickyNote, type LucideProps } from 'lucide-react'
import type { NoteKind } from '@/lib/notes'

const ICONS = {
  note: StickyNote,
  hug: HeartHandshake,
  pat: Hand,
  snack: Cookie,
} satisfies Record<NoteKind, React.ComponentType<LucideProps>>

export function NoteKindIcon({ kind, ...props }: { kind: NoteKind } & LucideProps) {
  const Icon = ICONS[kind] ?? StickyNote
  return <Icon aria-hidden="true" {...props} />
}
