'use client'

import { MoodFace } from '@/components/mood-face'
import { MOODS, type MoodId } from '@/lib/moods'
import type { MoodShape } from '@/lib/partners'
import { cn } from '@/lib/utils'

type Props = {
  shape: MoodShape
  value: string | null
  onChange: (mood: MoodId | null) => void
  size?: 'sm' | 'md'
}

export function MoodPicker({ shape, value, onChange, size = 'md' }: Props) {
  return (
    <div role="radiogroup" aria-label="选择心情" className="grid grid-cols-5 gap-1">
      {MOODS.map((m) => {
        const selected = value === m.id
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(selected ? null : m.id)}
            className={cn(
              'flex min-w-0 flex-col items-center gap-1 rounded-xl px-0.5 py-2 transition',
              selected ? 'bg-secondary' : 'opacity-55 hover:opacity-100',
            )}
          >
            <MoodFace
              mood={m.id}
              shape={shape}
              className={cn(
                'transition',
                size === 'sm' ? 'size-8' : 'size-9',
                selected && '-rotate-6 scale-110',
              )}
            />
            <span className="whitespace-nowrap font-hand text-base">{m.label}</span>
          </button>
        )
      })}
    </div>
  )
}
