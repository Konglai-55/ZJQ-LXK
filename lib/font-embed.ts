/**
 * Builds @font-face CSS containing only the font slices that cover the characters shown in `node`.
 * CJK web fonts are split into hundreds of unicode-range slices, so embedding them all is slow and flaky.
 */

function rangeCovers(range: string, codepoints: Set<number>) {
  for (const token of range.split(',')) {
    const t = token.trim().replace(/^U\+/i, '')
    if (!t) continue
    let lo: number
    let hi: number
    if (t.includes('?')) {
      lo = parseInt(t.replace(/\?/g, '0'), 16)
      hi = parseInt(t.replace(/\?/g, 'F'), 16)
    } else if (t.includes('-')) {
      const [a, b] = t.split('-')
      lo = parseInt(a, 16)
      hi = parseInt(b, 16)
    } else {
      lo = hi = parseInt(t, 16)
    }
    for (const cp of codepoints) if (cp >= lo && cp <= hi) return true
  }
  return false
}

function toDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export async function buildFontEmbedCSS(node: HTMLElement) {
  const codepoints = new Set<number>()
  for (const ch of node.innerText) codepoints.add(ch.codePointAt(0)!)

  const families = new Set<string>()
  for (const el of [node, ...Array.from(node.querySelectorAll<HTMLElement>('*'))]) {
    for (const name of getComputedStyle(el).fontFamily.split(',')) {
      families.add(name.trim().replace(/^["']|["']$/g, ''))
    }
  }

  const jobs: Promise<string>[] = []
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList
    try {
      rules = sheet.cssRules
    } catch {
      continue
    }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSFontFaceRule)) continue
      const family = rule.style.getPropertyValue('font-family').trim().replace(/^["']|["']$/g, '')
      if (!families.has(family)) continue
      const range = rule.style.getPropertyValue('unicode-range')
      if (range && !rangeCovers(range, codepoints)) continue
      const url = /url\(["']?([^"')]+)["']?\)/.exec(rule.style.getPropertyValue('src'))?.[1]
      if (!url) continue

      const absolute = new URL(url, sheet.href ?? location.href).href
      jobs.push(
        fetch(absolute)
          .then((res) => res.blob())
          .then(toDataUrl)
          .then(
            (data) =>
              `@font-face{font-family:"${family}";font-weight:${rule.style.getPropertyValue('font-weight') || 'normal'};font-style:${rule.style.getPropertyValue('font-style') || 'normal'};src:url(${data});${range ? `unicode-range:${range};` : ''}}`,
          )
          .catch(() => ''),
      )
    }
  }

  return (await Promise.all(jobs)).join('\n')
}
