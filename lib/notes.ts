export const NOTE_KINDS = [
  { id: 'note', label: '小纸条', hint: '写一句悄悄话' },
  { id: 'hug', label: '抱抱', hint: '给你一个大大的抱抱' },
  { id: 'pat', label: '摸摸头', hint: '摸摸头，不难过' },
  { id: 'snack', label: '投喂', hint: '喂你一口好吃的' },
] as const

export type NoteKind = (typeof NOTE_KINDS)[number]['id']

export const MAX_NOTE_LENGTH = 120

export function isNoteKind(value: unknown): value is NoteKind {
  return NOTE_KINDS.some((k) => k.id === value)
}

export function getNoteKind(id: string) {
  return NOTE_KINDS.find((k) => k.id === id) ?? NOTE_KINDS[0]
}
