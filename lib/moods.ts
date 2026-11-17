export const MOODS = [
  { id: 'calm', label: '平静', color: '#A5D98C' },
  { id: 'happy', label: '开心', color: '#F8B07A' },
  { id: 'excited', label: '超开心', color: '#F8DA5B' },
  { id: 'love', label: '心动', color: '#F4A2B4' },
  { id: 'sad', label: '难过', color: '#9ED4F1' },
] as const

export type MoodId = (typeof MOODS)[number]['id']

export function isMoodId(value: unknown): value is MoodId {
  return MOODS.some((m) => m.id === value)
}

export function getMood(id: string | null | undefined) {
  return MOODS.find((m) => m.id === id) ?? null
}
