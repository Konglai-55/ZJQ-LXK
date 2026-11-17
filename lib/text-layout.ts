export type Rect = { x: number; y: number; w: number; h: number }
export type Run = { text: string; x: number; y: number; start: number }
export type Point = { x: number; y: number }
export type TextLayout = { runs: Run[]; carets: Point[]; height: number }

type Segment = { start: number; end: number }

const MAX_LINES = 4000
const NO_LINE_START = new Set('，。、；：？！）》」』】…—,.;:?!)]}~～'.split(''))

function freeSegments(top: number, lineHeight: number, width: number, obstacles: Rect[], minWidth: number) {
  const bottom = top + lineHeight
  const blocked = obstacles
    .filter((o) => o.y < bottom && o.y + o.h > top)
    .map((o) => [Math.max(0, o.x), Math.min(width, o.x + o.w)] as const)
    .filter(([a, b]) => b > a)
    .sort((a, b) => a[0] - b[0])

  const segments: Segment[] = []
  let cursor = 0
  for (const [a, b] of blocked) {
    if (a > cursor) segments.push({ start: cursor, end: a })
    cursor = Math.max(cursor, b)
  }
  if (cursor < width) segments.push({ start: cursor, end: width })
  return segments.filter((s) => s.end - s.start >= minWidth)
}

/**
 * Lays text out line by line, flowing each line through the horizontal gaps
 * left between obstacles, so the words wrap around photos wherever they sit.
 */
export function layoutText(
  text: string,
  width: number,
  lineHeight: number,
  obstacles: Rect[],
  measure: (ch: string) => number,
): TextLayout {
  const minWidth = Math.max(measure('字'), 12)
  const runs: Run[] = []
  const carets: Point[] = new Array(text.length + 1)

  let line = -1
  let segments: Segment[] = []
  let segIndex = 0
  let x = 0
  let run: Run | null = null

  const nextLine = () => {
    run = null
    do {
      line++
      segments = freeSegments(line * lineHeight, lineHeight, width, obstacles, minWidth)
    } while (segments.length === 0 && line < MAX_LINES)
    if (segments.length === 0) segments = [{ start: 0, end: width }]
    segIndex = 0
    x = segments[0].start
  }

  nextLine()

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '\n') {
      carets[i] = { x, y: line * lineHeight }
      nextLine()
      continue
    }

    const w = measure(ch)
    // Closing punctuation hangs past the edge instead of starting a new line.
    const hangs = NO_LINE_START.has(ch) && x > segments[segIndex].start
    while (!hangs && x + w > segments[segIndex].end + 0.5 && x > segments[segIndex].start) {
      if (segIndex + 1 < segments.length) {
        segIndex++
        x = segments[segIndex].start
        run = null
      } else {
        nextLine()
      }
    }

    const y = line * lineHeight
    carets[i] = { x, y }
    if (run) {
      run.text += ch
    } else {
      run = { text: ch, x, y, start: i }
      runs.push(run)
    }
    x += w
  }

  carets[text.length] = { x, y: line * lineHeight }
  return { runs, carets, height: (line + 1) * lineHeight }
}

/** Index of the caret closest to a point, preferring the line under the pointer. */
export function caretAt(layout: TextLayout, px: number, py: number, lineHeight: number) {
  const { carets } = layout
  let bestLineY = carets[0].y
  let bestLineDist = Infinity
  for (const c of carets) {
    const d = Math.abs(c.y + lineHeight / 2 - py)
    if (d < bestLineDist) {
      bestLineDist = d
      bestLineY = c.y
    }
  }
  let best = 0
  let bestDist = Infinity
  carets.forEach((c, i) => {
    if (c.y !== bestLineY) return
    const d = Math.abs(c.x - px)
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  })
  return best
}

/** Caret index on the neighbouring line (direction -1 up, +1 down) nearest to the current x. */
export function caretVertical(layout: TextLayout, index: number, direction: -1 | 1) {
  const { carets } = layout
  const current = carets[index]
  let targetY: number | null = null
  for (const c of carets) {
    if (direction < 0 ? c.y < current.y : c.y > current.y) {
      if (targetY === null || (direction < 0 ? c.y > targetY : c.y < targetY)) targetY = c.y
    }
  }
  if (targetY === null) return direction < 0 ? 0 : carets.length - 1
  let best = index
  let bestDist = Infinity
  carets.forEach((c, i) => {
    if (c.y !== targetY) return
    const d = Math.abs(c.x - current.x)
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  })
  return best
}
