'use client'

import { Check, ImagePlus, Loader2, Maximize2, Minus, Plus, Trash2 } from 'lucide-react'
import { StampViewer } from '@/components/stamp-viewer'
import { cn } from '@/lib/utils'
import { uploadImage } from '@/lib/upload-image'
import { useEffect, useRef, useState } from 'react'
import { DiaryCanvas } from '@/components/diary-canvas'
import { LockGate } from '@/components/lock-gate'
import { LockSettings } from '@/components/lock-settings'
import { MoodFace } from '@/components/mood-face'
import { MoodPicker } from '@/components/mood-picker'
import { saveEntry, type Entry } from '@/hooks/use-entries'
import { useLock } from '@/hooks/use-lock'
import { MAX_IMAGES, MAX_STAMP_W, MIN_STAMP_W, type DiaryImage } from '@/lib/diary-images'
import { getMood } from '@/lib/moods'
import { PARTNERS, type PartnerId } from '@/lib/partners'

type Props = {
  me: PartnerId
  owner: PartnerId
  date: string
  entry?: Entry
}

export function DiaryPage({ me, owner, date, entry }: Props) {
  const editable = me === owner
  const person = PARTNERS[owner]
  const mood = getMood(entry?.mood)

  return (
    <article className="paper-grain paper-shadow relative flex flex-col rounded-sm bg-paper">
      <div aria-hidden="true" className="absolute -top-2.5 left-10 h-6 w-20 -rotate-3 bg-tape" />
      <header className="flex items-center justify-between gap-3 px-5 pb-2 pt-7 sm:px-6">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="whitespace-nowrap font-hand text-2xl leading-tight sm:text-3xl">
            {person.name}
            <span className="text-muted-foreground">的日记</span>
          </h3>
          <span className="text-xs text-muted-foreground">
            {mood ? `今天的心情：${mood.label}` : editable ? '先选一个今天的心情吧' : '还没有选择心情'}
          </span>
        </div>
        {mood && <MoodFace mood={mood.id} shape={person.shape} className="size-12 shrink-0 rotate-6 sm:size-14" />}
      </header>

      {editable ? (
        <EditableBody me={me} date={date} entry={entry} />
      ) : (
        <PartnerBody entry={entry} name={person.name} />
      )}
    </article>
  )
}

function PartnerBody({ entry, name }: { entry?: Entry; name: string }) {
  const { status, unlock } = useLock()
  const [viewing, setViewing] = useState<string | null>(null)

  if (status?.theirs && !status.canReadTheirs) {
    return <LockGate name={name} onUnlock={unlock} />
  }

  if (!entry?.content && !entry?.images.length) {
    return (
      <div className="paper-lined flex min-h-[26rem] flex-col items-center justify-center gap-2 px-12 pb-6 text-center">
        <p className="font-hand text-2xl text-muted-foreground">{name}还没有写这一天的日记</p>
        <p className="text-xs text-muted-foreground">悄悄催一下吧</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col pb-6">
      {entry.images.length > 0 && (
        <p className="border-y border-dashed px-5 py-2 text-xs text-muted-foreground">点邮票可以看大图</p>
      )}
      <DiaryCanvas
        text={entry.content}
        images={entry.images}
        editable={false}
        label={`${name}的日记`}
        onStampTap={setViewing}
      />
      <StampViewer pathname={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}

function EditableBody({ me, date, entry }: { me: PartnerId; date: string; entry?: Entry }) {
  const [draft, setDraft] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [viewing, setViewing] = useState<string | null>(null)

  const saved = entry?.content ?? ''
  const content = draft ?? saved
  const dirty = draft !== null && draft !== saved
  const images = entry?.images ?? []
  const selectedImage = images.find((i) => i.p === selected) ?? null

  function resizeSelected(delta: number) {
    if (!selectedImage) return
    const w = Math.min(MAX_STAMP_W, Math.max(MIN_STAMP_W, selectedImage.w + delta))
    const center = selectedImage.x + selectedImage.w / 2
    const x = Math.min(1 - w, Math.max(0, center - w / 2))
    saveEntry(me, date, { images: images.map((i) => (i.p === selectedImage.p ? { ...i, w, x } : i)) })
  }

  function removeSelected() {
    if (!selectedImage) return
    saveEntry(me, date, { images: images.filter((i) => i.p !== selectedImage.p) })
    setSelected(null)
  }

  useEffect(() => {
    if (!dirty || draft === null) return
    const timer = setTimeout(async () => {
      setStatus('saving')
      try {
        await saveEntry(me, date, { content: draft })
        setStatus('saved')
      } catch {
        setStatus('error')
      }
    }, 900)
    return () => clearTimeout(timer)
  }, [draft, dirty, me, date])

  async function upload(files: FileList | null) {
    if (!files?.length) return
    setUploadError(null)
    setUploading(true)
    const added: DiaryImage[] = []
    try {
      for (const file of Array.from(files).slice(0, MAX_IMAGES - images.length)) {
        const pathname = await uploadImage(file)
        const n = images.length + added.length
        added.push({ p: pathname, w: 0.4, x: n % 2 === 0 ? 0.58 : 0.02, y: 18 + n * 72 })
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '上传失败')
    }
    if (added.length) {
      await saveEntry(me, date, { images: [...images, ...added] }).catch(() => setUploadError('保存照片失败'))
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="flex flex-col pb-6">
      <div className="px-3 pb-2 sm:px-4">
        <MoodPicker
          size="sm"
          shape={PARTNERS[me].shape}
          value={entry?.mood ?? null}
          onChange={(mood) => saveEntry(me, date, { mood })}
        />
      </div>

      <div className="sticky top-0 z-20 flex flex-col gap-1 border-y border-dashed bg-paper/95 px-4 py-2.5 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            id={`photo-${date}`}
            onChange={(e) => upload(e.target.files)}
            disabled={uploading || images.length >= MAX_IMAGES}
          />
          <label
            htmlFor={`photo-${date}`}
            className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-dashed border-foreground/30 px-3 py-1.5 text-sm transition hover:border-primary hover:text-primary"
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <ImagePlus className="size-4" aria-hidden="true" />
            )}
            {uploading ? '贴邮票中…' : '贴邮票'}
          </label>
          <LockSettings />
          <p aria-live="polite" className="ml-auto flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
            {status === 'saving' && '保存中…'}
            {status === 'saved' && !dirty && (
              <>
                <Check className="size-3.5" aria-hidden="true" />
                已收好
              </>
            )}
            {dirty && status === 'idle' && '写着呢…'}
            {status === 'error' && <span className="text-destructive">没保存上</span>}
          </p>
        </div>
        {uploadError && (
          <p role="alert" className="text-xs text-destructive">
            {uploadError}
          </p>
        )}
        {selectedImage ? (
          <div className="flex items-center gap-2 pt-1">
            <p className="min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground">双指捏合也能缩放</p>
            <StampTool label="缩小" onClick={() => resizeSelected(-0.1)} disabled={selectedImage.w <= MIN_STAMP_W}>
              <Minus className="size-4" aria-hidden="true" />
            </StampTool>
            <StampTool label="放大" onClick={() => resizeSelected(0.1)} disabled={selectedImage.w >= MAX_STAMP_W}>
              <Plus className="size-4" aria-hidden="true" />
            </StampTool>
            <StampTool label="看大图" onClick={() => setViewing(selectedImage.p)}>
              <Maximize2 className="size-4" aria-hidden="true" />
            </StampTool>
            <StampTool label="撕掉" onClick={removeSelected} danger>
              <Trash2 className="size-4" aria-hidden="true" />
            </StampTool>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="rounded-full bg-foreground px-3 py-1.5 text-xs text-background"
            >
              好了
            </button>
          </div>
        ) : (
          images.length > 0 && (
            <p className="text-xs text-muted-foreground">按住邮票拖动换位置，点一下可以缩放</p>
          )
        )}
      </div>

      <DiaryCanvas
        text={content}
        images={images}
        editable
        label="写下今天的日记"
        placeholder="点任意一行，从那里开始写……"
        onTextChange={(t) => {
          setDraft(t)
          setStatus('idle')
        }}
        onImagesCommit={(next) => saveEntry(me, date, { images: next })}
        selectedStamp={selected}
        onStampTap={(p) => setSelected((cur) => (cur === p ? null : p))}
        onBackgroundTap={() => setSelected(null)}
      />
      <StampViewer pathname={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}

function StampTool({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full border transition disabled:opacity-30',
        danger ? 'border-destructive/40 text-destructive' : 'border-foreground/20',
      )}
    >
      {children}
    </button>
  )
}
