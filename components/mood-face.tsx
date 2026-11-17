import { getMood, type MoodId } from '@/lib/moods'
import type { MoodShape } from '@/lib/partners'
import { cn } from '@/lib/utils'

const INK = '#3a2e2a'
const RED = '#e8553b'

type MoodFaceProps = {
  mood: MoodId | string | null | undefined
  shape: MoodShape
  className?: string
  title?: string
  /** Skip the page-level hand-drawn filter, which cannot be referenced from an exported image. */
  plain?: boolean
}

export function MoodFace({ mood, shape, className, title, plain }: MoodFaceProps) {
  const info = getMood(mood)
  const filter = plain ? undefined : 'url(#hand-drawn)'
  const stroke = {
    stroke: INK,
    strokeWidth: 4.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  }

  return (
    <svg
      viewBox="-8 -8 116 116"
      className={cn('overflow-visible', className)}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {info ? (
        <g filter={filter}>
          {shape === 'circle' ? (
            <circle cx="50" cy="52" r="43" fill={info.color} />
          ) : (
            <rect x="7" y="9" width="86" height="86" rx="14" fill={info.color} />
          )}
        </g>
      ) : (
        <g filter={filter}>
          {shape === 'circle' ? (
            <circle cx="50" cy="52" r="41" fill="none" stroke="#cfc6b8" strokeWidth="3" strokeDasharray="6 7" />
          ) : (
            <rect x="9" y="11" width="82" height="82" rx="14" fill="none" stroke="#cfc6b8" strokeWidth="3" strokeDasharray="6 7" />
          )}
        </g>
      )}

      {info?.id === 'calm' && (
        <g>
          <path d="M29 47h13M58 47h13" {...stroke} />
          <path d="M44 62q6 5 12 0" {...stroke} />
        </g>
      )}

      {info?.id === 'happy' && (
        <g>
          <ellipse cx="22" cy="61" rx="7" ry="4" fill="#f27a5e" opacity="0.4" />
          <ellipse cx="78" cy="61" rx="7" ry="4" fill="#f27a5e" opacity="0.4" />
          <circle cx="36" cy="46" r="4.6" fill={INK} />
          <circle cx="64" cy="46" r="4.6" fill={INK} />
          <path d="M41 55h18l-9 17z" fill={RED} stroke={RED} strokeWidth="2" strokeLinejoin="round" />
          <path d="M2 14l11-9M5 4l7 10" stroke={RED} strokeWidth="4" strokeLinecap="round" fill="none" />
        </g>
      )}

      {info?.id === 'excited' && (
        <g>
          <ellipse cx="21" cy="60" rx="6" ry="3.5" fill="#f2a03a" opacity="0.45" />
          <ellipse cx="79" cy="60" rx="6" ry="3.5" fill="#f2a03a" opacity="0.45" />
          <path d="M29 39l12 7-12 7M71 39l-12 7 12 7" {...stroke} />
          <path d="M38 58q12 20 24 0z" fill={RED} stroke={RED} strokeWidth="2" strokeLinejoin="round" />
          <path d="M2 18l7 4M8 6l5 8M19 -1l2 9" stroke="#e0a400" strokeWidth="4" strokeLinecap="round" fill="none" />
        </g>
      )}

      {info?.id === 'love' && (
        <g>
          <circle cx="22" cy="61" r="2" fill="#e8435e" />
          <circle cx="28" cy="64" r="2" fill="#e8435e" />
          <circle cx="72" cy="64" r="2" fill="#e8435e" />
          <circle cx="78" cy="61" r="2" fill="#e8435e" />
          <path d="M30 40l11 7-11 7M70 40l-11 7 11 7" {...stroke} />
          <path d="M38 60q12 13 24 0" {...stroke} />
          <path d="M90 10c-4-8-15-5-12 4l12 12 12-12c3-9-8-12-12-4z" fill="#e8435e" />
        </g>
      )}

      {info?.id === 'sad' && (
        <g>
          <path d="M29 44l13 4M71 44l-13 4" {...stroke} />
          <path d="M42 68q8-9 16 0" {...stroke} />
          <path d="M66 52q5 8 0 12q-5-4 0-12z" fill="#ffffff" stroke={INK} strokeWidth="2" />
          <path d="M84 3a8 8 0 1 1-1 15" stroke="#3f86d6" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        </g>
      )}
    </svg>
  )
}
