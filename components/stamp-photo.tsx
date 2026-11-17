'use client'

import { useRef } from 'react'
import { tiltFor, type DiaryImage } from '@/lib/diary-images'
import { cn } from '@/lib/utils'
import { StorageImage } from '@/components/storage-image'

const PERF = 12

/** Stamp dimensions snap to the perforation pitch so the holes land evenly on every edge. */
export function stampSize(w: number, areaW: number) {
  const W = Math.max(PERF * 6, Math.round((w * areaW) / PERF) * PERF)
  const H = Math.round(((W - 20) * 1.25 + 20) / PERF) * PERF
  return { W, H }
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

type Props = {
  image: DiaryImage
  index: number
  areaW: number
  editable: boolean
  selected?: boolean
  pinching?: React.RefObject<boolean>
  onTap?: () => void
  onMove?: (image: DiaryImage) => void
  onCommit?: () => void
}

export function StampPhoto({ image, index, areaW, editable, selected, pinching, onTap, onMove, onCommit }: Props) {
  const { W, H } = stampSize(image.w, areaW)
  const drag = useRef<{
    id: number
    sx: number
    sy: number
    img: DiaryImage
    moved: boolean
    aborted: boolean
  } | null>(null)

  function down(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || drag.current) return
    e.stopPropagation()
    if (!editable) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, img: image, moved: false, aborted: false }
  }

  function move(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d || d.id !== e.pointerId || d.aborted || !onMove) return
    if (pinching?.current) {
      d.aborted = true
      return
    }
    const dx = e.clientX - d.sx
    const dy = e.clientY - d.sy
    if (!d.moved && Math.hypot(dx, dy) < 6) return
    d.moved = true
    onMove({ ...d.img, x: clamp(d.img.x + dx / areaW, 0, 1 - d.img.w), y: Math.max(0, d.img.y + dy) })
  }

  function up(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    if (d.moved && !d.aborted) onCommit?.()
    else if (!d.aborted) onTap?.()
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={editable ? `第 ${index + 1} 张邮票，点一下选中` : `查看第 ${index + 1} 张邮票大图`}
      aria-pressed={editable ? selected : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onTap?.()
        }
      }}
      onClick={editable ? undefined : onTap}
      className={cn('absolute outline-none', editable && 'touch-none')}
      style={{ left: image.x * areaW, top: image.y, width: W, height: H, zIndex: selected ? 10 : undefined }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => (drag.current = null)}
    >
      <div
        className={cn('size-full transition-[filter,scale] duration-200', selected ? 'stamp-shadow-lifted scale-[1.04]' : 'stamp-shadow')}
        style={{ rotate: `${tiltFor(image.p)}deg` }}
      >
        <div className="stamp-edge flex size-full bg-card p-2.5">
          <div className="flex-1 overflow-hidden border border-foreground/15">
            <StorageImage
              pathname={image.p}
              alt={`日记照片 ${index + 1}`}
              draggable={false}
              loading="lazy"
              className="pointer-events-none size-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
