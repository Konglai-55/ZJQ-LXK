'use client'

import { Dialog } from '@base-ui/react/dialog'
import { Download, Loader2, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { MoodFace } from '@/components/mood-face'
import { StorageImage } from '@/components/storage-image'
import type { Entry } from '@/hooks/use-entries'
import { MONTH_NAMES, MONTH_NAMES_EN } from '@/lib/calendar'
import { tiltFor } from '@/lib/diary-images'
import { MOODS, getMood } from '@/lib/moods'
import { PARTNERS, PARTNER_ORDER } from '@/lib/partners'
import { computeRecap } from '@/lib/recap'
import { cn } from '@/lib/utils'

type Props = {
  year: number
  month: number
  todayKey: string
  cells: (string | null)[]
  entries: Map<string, Entry>
  open: boolean
  onOpenChange: (open: boolean) => void
}

const md = (key: string) => `${Number(key.slice(5, 7))}月${Number(key.slice(8))}日`

export function MonthRecap({ year, month, todayKey, cells, entries, open, onOpenChange }: Props) {
  const recap = useMemo(() => computeRecap(cells, todayKey, entries), [cells, todayKey, entries])
  const sheetRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const empty = recap.elapsedDays === 0

  async function save() {
    const node = sheetRef.current
    if (!node) return
    setSaving(true)
    setError(null)
    try {
      const [{ toBlob }, { buildFontEmbedCSS }] = await Promise.all([
        import('html-to-image'),
        import('@/lib/font-embed'),
      ])
      const fontEmbedCSS = await buildFontEmbedCSS(node)
      const blob = await toBlob(node, { fontEmbedCSS, pixelRatio: 2, backgroundColor: '#fbfaf6' })
      if (!blob) throw new Error('empty')
      const name = `恋爱手账-${year}-${String(month + 1).padStart(2, '0')}.png`
      const file = new File([blob], name, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${MONTH_NAMES[month]}手账` })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = name
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 2000)
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setError('保存没成功，可以先直接截屏')
      }
    }
    setSaving(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-[2px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-x-0 bottom-0 top-4 z-50 flex flex-col overflow-hidden rounded-t-3xl bg-background outline-none transition data-[ending-style]:translate-y-6 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-6 data-[starting-style]:opacity-0 md:inset-x-6 md:bottom-6 md:top-6 md:mx-auto md:max-w-xl md:rounded-3xl">
          <header className="flex items-center justify-between gap-2 border-b border-dashed px-5 py-3">
            <div className="flex flex-col">
              <Dialog.Title className="font-hand text-3xl leading-tight">{MONTH_NAMES[month]}手账</Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground">这个月的我们，自动整理好了</Dialog.Description>
            </div>
            <Dialog.Close aria-label="关闭" className="flex size-10 items-center justify-center rounded-full hover:bg-secondary">
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </header>

          <div className="flex-1 overflow-y-auto">
            <div ref={sheetRef} className="bg-background p-4">
              <div className="paper-grain paper-shadow relative flex flex-col gap-7 rounded-sm bg-paper px-5 pb-8 pt-10 font-hand">
                <div aria-hidden="true" className="absolute -top-3 left-8 h-7 w-24 -rotate-3 bg-tape" />

                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    {MONTH_NAMES_EN[month]} · {year}
                  </span>
                  <span className="font-hand text-6xl leading-none">{MONTH_NAMES[month]}手账</span>
                  <span className="mt-1 font-hand text-xl text-primary">梁熙坤 &amp; 祝佳琪</span>
                </div>

                {empty ? (
                  <p className="py-10 text-center font-hand text-2xl text-muted-foreground">这个月还没开始，先去选个心情吧</p>
                ) : (
                  <>
                    <section className="flex items-end gap-4 border-y border-dashed py-5">
                      <span className="font-hand text-7xl leading-none text-primary">{recap.togetherHappy}</span>
                      <span className="flex flex-col pb-1">
                        <span className="font-hand text-2xl leading-tight">天，我们一起开心</span>
                        <span className="text-lg text-muted-foreground">
                          两个人都记录心情的 {recap.bothRecorded} 天里
                        </span>
                      </span>
                    </section>

                    <section className="flex flex-col gap-5" aria-label="心情">
                      {PARTNER_ORDER.map((id) => {
                        const p = recap.partners[id]
                        const top = getMood(p.topMood)
                        return (
                          <div key={id} className="flex flex-col gap-2">
                            <div className="flex flex-col">
                              <h3 className="text-3xl leading-tight">{PARTNERS[id].name}</h3>
                              <span className="text-lg leading-tight text-muted-foreground">
                                记录 {p.recordedDays} 天 · 日记 {p.diaryCount} 篇
                                {top ? ` · 最常是「${top.label}」` : ''}
                              </span>
                            </div>
                            <ul className="grid grid-cols-5 gap-1">
                              {MOODS.map((m) => (
                                <li key={m.id} className={cn('flex flex-col items-center gap-0.5', p.moodCounts[m.id] === 0 && 'opacity-30')}>
                                  <MoodFace mood={m.id} shape={PARTNERS[id].shape} plain className="size-10" />
                                  <span className="font-hand text-xl leading-none">{p.moodCounts[m.id]}</span>
                                  <span className="text-base text-muted-foreground">{m.label}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      })}
                    </section>

                    {recap.bestDay && (
                      <section className="flex items-center gap-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3">
                        <div className="flex -space-x-2">
                          {PARTNER_ORDER.map((id) => (
                            <MoodFace key={id} mood={recap.bestDay?.moods[id]} shape={PARTNERS[id].shape} plain className="size-11" />
                          ))}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-lg text-muted-foreground">这个月最开心的一天</span>
                          <span className="font-hand text-3xl leading-tight text-primary">{md(recap.bestDay.date)}</span>
                        </div>
                      </section>
                    )}

                    {PARTNER_ORDER.some((id) => recap.partners[id].quote) && (
                      <section className="flex flex-col gap-3" aria-label="摘一句">
                        {PARTNER_ORDER.map((id) => {
                          const q = recap.partners[id].quote
                          if (!q) return null
                          return (
                            <figure key={id} className="flex flex-col gap-1 border-l-2 border-primary/40 pl-4">
                              <blockquote className="text-pretty font-hand text-2xl leading-8">{q.text}</blockquote>
                              <figcaption className="text-base text-muted-foreground">
                                {PARTNERS[id].name} · {md(q.date)}
                              </figcaption>
                            </figure>
                          )
                        })}
                      </section>
                    )}

                    {recap.stamps.length > 0 && (
                      <section className="flex flex-wrap justify-center gap-4 py-1" aria-label="贴过的邮票">
                        {recap.stamps.map((s) => (
                          <div
                            key={s.p}
                            className="stamp-shadow h-30 w-24"
                            style={{ rotate: `${tiltFor(s.p)}deg` }}
                          >
                            <div className="stamp-edge flex size-full bg-card p-2.5">
                              <div className="flex-1 overflow-hidden border border-foreground/15">
                                <StorageImage pathname={s.p} alt="" className="size-full object-cover" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </section>
                    )}
                    {recap.hiddenFor.length > 0 && (
                      <p className="text-center text-base text-muted-foreground">
                        {recap.hiddenFor.map((id) => PARTNERS[id].name).join('、')}的日记上了锁，摘句和邮票先藏起来了
                      </p>
                    )}
                  </>
                )}

                {recap.specials.length > 0 && (
                  <section className="flex flex-col gap-1.5 border-t border-dashed pt-4" aria-label="特别的日子">
                    {recap.specials.map((s) => (
                      <p key={`${s.date}-${s.label}`} className="flex items-baseline gap-3">
                        <span className="w-16 shrink-0 font-hand text-xl">{md(s.date)}</span>
                        <span className={cn('text-lg', s.kind === 'holiday' ? 'text-muted-foreground' : 'font-semibold text-primary')}>
                          {s.detail}
                        </span>
                      </p>
                    ))}
                  </section>
                )}
              </div>
            </div>
          </div>

          <footer className="flex flex-col gap-1 border-t border-dashed px-4 py-3">
            {error && (
              <p role="alert" className="text-center text-xs text-destructive">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={save}
              disabled={saving || empty}
              className="flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 font-hand text-2xl text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
            >
              {saving ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Download className="size-5" aria-hidden="true" />}
              {saving ? '正在装订…' : '保存成图片'}
            </button>
          </footer>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
