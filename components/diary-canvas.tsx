'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { StampPhoto, stampSize } from '@/components/stamp-photo'
import { MAX_STAMP_W, MIN_STAMP_W, type DiaryImage } from '@/lib/diary-images'
import { caretAt, caretVertical, layoutText, type Rect } from '@/lib/text-layout'

const PAD_L = 48
const PAD_R = 20
const LH = 36
const GAP = 12
const MIN_LINES = 12

type Props = {
  text: string
  images: DiaryImage[]
  editable: boolean
  label: string
  placeholder?: string
  maxLength?: number
  onTextChange?: (text: string) => void
  onImagesCommit?: (images: DiaryImage[]) => void
  selectedStamp?: string | null
  onStampTap?: (pathname: string) => void
  onBackgroundTap?: () => void
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

function useTextMeasure(font: string, version: number) {
  return useMemo(() => {
    const cache = new Map<string, number>()
    const ctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null
    if (ctx) ctx.font = font
    return (ch: string) => {
      let w = cache.get(ch)
      if (w === undefined) {
        w = ctx ? ctx.measureText(ch).width : 20
        cache.set(ch, w)
      }
      return w
    }
    // version forces fresh measurements once web font glyphs arrive
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [font, version])
}

export function DiaryCanvas({
  text,
  images,
  editable,
  label,
  placeholder,
  maxLength = 5000,
  onTextChange,
  onImagesCommit,
  selectedStamp = null,
  onStampTap,
  onBackgroundTap,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [box, setBox] = useState({ width: 0, font: '' })
  const [fontVersion, setFontVersion] = useState(0)
  const [sel, setSel] = useState({ start: text.length, end: text.length })
  const [focused, setFocused] = useState(false)
  const [dragImages, setDragImages] = useState<DiaryImage[] | null>(null)
  const pointer = useRef<{ anchor: number; x: number; y: number; type: string } | null>(null)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const cs = getComputedStyle(el)
      setBox({ width: el.clientWidth, font: `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}` })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!box.font) return
    const sample = text || '字'
    if (document.fonts.check(box.font, sample)) return
    let cancelled = false
    document.fonts
      .load(box.font, sample)
      .then(() => {
        if (!cancelled) setFontVersion((v) => v + 1)
      })
      .catch(() => {
        // Fallback font metrics still produce a usable layout.
      })
    return () => {
      cancelled = true
    }
  }, [box.font, text])

  const measure = useTextMeasure(box.font, fontVersion)
  const areaW = Math.max(0, box.width - PAD_L - PAD_R)
  const shownImages = dragImages ?? images

  // Two-finger pinch anywhere on the page resizes the selected stamp (mobile-first).
  const pinching = useRef(false)
  const live = useRef({ images: shownImages, selected: selectedStamp, commit: onImagesCommit })
  useLayoutEffect(() => {
    live.current = { images: shownImages, selected: selectedStamp, commit: onImagesCommit }
  })

  useEffect(() => {
    const el = containerRef.current
    if (!el || !editable) return
    let start: { d: number; img: DiaryImage } | null = null
    let draft: DiaryImage[] | null = null
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)

    const onStart = (e: TouchEvent) => {
      const { selected, images: list } = live.current
      if (e.touches.length !== 2 || !selected) return
      const img = list.find((i) => i.p === selected)
      if (!img) return
      e.preventDefault()
      pinching.current = true
      start = { d: dist(e.touches) || 1, img }
    }
    const onMove = (e: TouchEvent) => {
      if (!start || e.touches.length < 2) return
      e.preventDefault()
      const w = clamp(start.img.w * (dist(e.touches) / start.d), MIN_STAMP_W, MAX_STAMP_W)
      const center = start.img.x + start.img.w / 2
      const next = { ...start.img, w, x: clamp(center - w / 2, 0, 1 - w) }
      draft = live.current.images.map((i) => (i.p === next.p ? next : i))
      setDragImages(draft)
    }
    const onEnd = (e: TouchEvent) => {
      if (!start || e.touches.length >= 2) return
      start = null
      if (draft) live.current.commit?.(draft)
      draft = null
      setDragImages(null)
      setTimeout(() => (pinching.current = false), 80)
    }
    const blockZoom = (e: Event) => {
      if (live.current.selected) e.preventDefault()
    }

    el.addEventListener('touchstart', onStart, { passive: false })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd)
    el.addEventListener('touchcancel', onEnd)
    el.addEventListener('gesturestart', blockZoom)
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
      el.removeEventListener('gesturestart', blockZoom)
    }
  }, [editable])

  const obstacles: Rect[] = useMemo(
    () =>
      shownImages.map((img) => {
        const { W, H } = stampSize(img.w, areaW)
        return { x: img.x * areaW - GAP, y: img.y - GAP, w: W + GAP * 2, h: H + GAP * 2 }
      }),
    [shownImages, areaW],
  )

  const layout = useMemo(
    () => (areaW > 0 ? layoutText(text, areaW, LH, obstacles, measure) : null),
    [text, areaW, obstacles, measure],
  )

  const placeholderLayout = useMemo(
    () => (!text && placeholder && areaW > 0 ? layoutText(placeholder, areaW, LH, obstacles, measure) : null),
    [text, placeholder, areaW, obstacles, measure],
  )

  const imagesBottom = obstacles.reduce((m, o) => Math.max(m, o.y + o.h), 0)
  const contentHeight = Math.max(
    MIN_LINES * LH,
    (layout?.height ?? 0) + (editable ? LH * 2 : LH),
    imagesBottom + LH,
  )
  const height = Math.ceil(contentHeight / LH) * LH

  const syncSelection = useCallback(() => {
    const ta = textareaRef.current
    if (ta) setSel({ start: ta.selectionStart, end: ta.selectionEnd })
  }, [])

  useEffect(() => {
    if (!focused) return
    document.addEventListener('selectionchange', syncSelection)
    return () => document.removeEventListener('selectionchange', syncSelection)
  }, [focused, syncSelection])

  function indexFromEvent(e: React.PointerEvent) {
    if (!layout) return 0
    const rect = e.currentTarget.getBoundingClientRect()
    return caretAt(layout, e.clientX - rect.left, e.clientY - rect.top, LH)
  }

  function placeCaret(start: number, end = start) {
    const ta = textareaRef.current
    if (!ta) return
    ta.focus({ preventScroll: true })
    ta.setSelectionRange(Math.min(start, end), Math.max(start, end), start > end ? 'backward' : 'forward')
    syncSelection()
  }

  /** Tapping an empty line below the text pads it with line breaks so writing starts on that line. */
  function tapAt(e: React.PointerEvent<HTMLDivElement>) {
    if (!layout) return 0
    const rect = e.currentTarget.getBoundingClientRect()
    const tappedLine = Math.floor((e.clientY - rect.top) / LH)
    const lastLine = Math.round(layout.carets[text.length].y / LH)
    const extra = tappedLine - lastLine
    if (extra > 0 && onTextChange && text.length + extra <= maxLength) {
      const next = text + '\n'.repeat(extra)
      pendingCaret.current = next.length
      textareaRef.current?.focus({ preventScroll: true })
      onTextChange(next)
      return next.length
    }
    const index = indexFromEvent(e)
    placeCaret(index)
    return index
  }

  function onAreaPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!editable || e.button !== 0) return
    pointer.current = { anchor: 0, x: e.clientX, y: e.clientY, type: e.pointerType }
    if (e.pointerType === 'mouse') {
      if (selectedStamp) onBackgroundTap?.()
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      pointer.current.anchor = tapAt(e)
    }
  }

  function onAreaPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const p = pointer.current
    if (!p || p.type !== 'mouse' || !(e.buttons & 1)) return
    placeCaret(p.anchor, indexFromEvent(e))
  }

  function onAreaPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const p = pointer.current
    pointer.current = null
    if (!p || p.type === 'mouse' || pinching.current) return
    if (Math.hypot(e.clientX - p.x, e.clientY - p.y) >= 10) return
    if (selectedStamp) {
      onBackgroundTap?.()
      return
    }
    tapAt(e)
  }

  const pendingCaret = useRef<number | null>(null)
  useLayoutEffect(() => {
    const target = pendingCaret.current
    const ta = textareaRef.current
    if (target === null || !ta || ta.value.length < target) return
    pendingCaret.current = null
    ta.focus({ preventScroll: true })
    ta.setSelectionRange(target, target)
    syncSelection()
  }, [text, syncSelection])

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!layout || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    e.preventDefault()
    const ta = e.currentTarget
    const backward = ta.selectionDirection === 'backward'
    const focus = backward ? ta.selectionStart : ta.selectionEnd
    const anchor = backward ? ta.selectionEnd : ta.selectionStart
    const next = caretVertical(layout, focus, e.key === 'ArrowUp' ? -1 : 1)
    placeCaret(e.shiftKey ? anchor : next, next)
  }

  const selectionRects = useMemo(() => {
    if (!layout || sel.start === sel.end) return []
    const rects: { x: number; y: number; w: number }[] = []
    for (let i = sel.start; i < sel.end && i < text.length; i++) {
      if (text[i] === '\n') continue
      const c = layout.carets[i]
      const w = measure(text[i])
      const last = rects[rects.length - 1]
      if (last && last.y === c.y && Math.abs(last.x + last.w - c.x) < 1) last.w += w
      else rects.push({ x: c.x, y: c.y, w })
    }
    return rects
  }, [layout, sel, text, measure])

  const caret = layout?.carets[Math.min(sel.end, text.length)]
  const caretRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (focused) caretRef.current?.scrollIntoView({ block: 'nearest' })
  }, [focused, caret?.x, caret?.y])

  return (
    <div
      ref={containerRef}
      className="paper-lined relative font-hand text-xl sm:text-2xl"
      style={{ height }}
    >
      <div
        className={editable ? 'absolute inset-y-0 cursor-text select-none' : 'absolute inset-y-0'}
        style={{ left: PAD_L, width: areaW }}
        onPointerDown={onAreaPointerDown}
        onPointerMove={onAreaPointerMove}
        onPointerUp={onAreaPointerUp}
      >
        {selectionRects.map((r, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="absolute rounded-sm bg-primary/20"
            style={{ left: r.x, top: r.y + 4, width: r.w, height: LH - 6 }}
          />
        ))}

        <div aria-hidden={editable ? true : undefined} className="text-foreground">
          {layout?.runs.map((run) => (
            <span
              key={`${run.start}-${run.y}`}
              className="absolute whitespace-pre"
              style={{ left: run.x, top: run.y, lineHeight: `${LH}px`, fontKerning: 'none' }}
            >
              {run.text}
            </span>
          ))}
        </div>

        {placeholderLayout?.runs.map((run) => (
          <span
            key={`ph-${run.start}`}
            aria-hidden="true"
            className="pointer-events-none absolute whitespace-pre text-muted-foreground/60"
            style={{ left: run.x, top: run.y, lineHeight: `${LH}px`, fontKerning: 'none' }}
          >
            {run.text}
          </span>
        ))}

        {editable && focused && caret && sel.start === sel.end && (
          <span
            ref={caretRef}
            aria-hidden="true"
            className="caret-blink pointer-events-none absolute w-0.5 scroll-mb-10 scroll-mt-24 rounded-full bg-primary"
            style={{ left: caret.x, top: caret.y + 6, height: LH - 10 }}
          />
        )}

        {areaW > 0 &&
          shownImages.map((img, i) => (
            <StampPhoto
              key={img.p}
              image={img}
              index={i}
              areaW={areaW}
              editable={editable}
              selected={selectedStamp === img.p}
              pinching={pinching}
              onTap={() => onStampTap?.(img.p)}
              onMove={(next) =>
                setDragImages((prev) => (prev ?? images).map((m) => (m.p === next.p ? next : m)))
              }
              onCommit={() => {
                if (dragImages) onImagesCommit?.(dragImages)
                setDragImages(null)
              }}
            />
          ))}
      </div>

      {editable && (
        <textarea
          ref={textareaRef}
          aria-label={label}
          value={text}
          maxLength={maxLength}
          onChange={(e) => {
            onTextChange?.(e.target.value)
            syncSelection()
          }}
          onSelect={syncSelection}
          onKeyDown={onKeyDown}
          onKeyUp={syncSelection}
          onFocus={() => {
            setFocused(true)
            syncSelection()
          }}
          onBlur={() => setFocused(false)}
          spellCheck={false}
          autoCapitalize="off"
          className="absolute size-px resize-none overflow-hidden border-0 bg-transparent p-0 text-base text-transparent caret-transparent opacity-0 outline-none"
          style={{ left: PAD_L + (caret?.x ?? 0), top: (caret?.y ?? 0) + 8 }}
        />
      )}
    </div>
  )
}
