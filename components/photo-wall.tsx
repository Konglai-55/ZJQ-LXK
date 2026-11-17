'use client'

import { Dialog } from '@base-ui/react/dialog'
import { ArrowLeft, Camera, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { PaperDialog } from '@/components/paper-dialog'
import { PARTNERS, type PartnerId } from '@/lib/partners'
import { MAX_PHOTO_STORY, MAX_PHOTO_TITLE, type SharedPhoto } from '@/lib/photos'
import { StorageImage } from '@/components/storage-image'
import { uploadImage } from '@/lib/upload-image'
import { todayInChina } from '@/lib/time'

async function photoRequest(url: string, init?: RequestInit) {
  const response = await fetch(url, init)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error ?? '暂时没有成功，请再试一次')
  return data
}

export function PhotoWall({ me, open, onOpenChange }: { me: PartnerId; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-background" />
        <Dialog.Popup className="fixed inset-0 z-50 overflow-y-auto bg-background outline-none">
          {open && <WallContent me={me} />}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function WallContent({ me }: { me: PartnerId }) {
  const { data, error, isLoading, mutate } = useSWR<{ photos: SharedPhoto[] }>('/api/photos', photoRequest, { refreshInterval: 30000 })
  const [selected, setSelected] = useState<SharedPhoto | null>(null)
  const [editor, setEditor] = useState<{ photo: SharedPhoto | null } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const photos = data?.photos ?? []

  async function remove(photo: SharedPhoto) {
    if (!window.confirm('把这张合照从墙上取下吗？照片和故事会一起移除。')) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await photoRequest('/api/photos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: photo.id }) })
      setSelected(null)
      await mutate()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : '没移除成功，请重试')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between gap-2 border-b border-dashed pb-4">
        <Dialog.Close aria-label="返回日历" className="flex size-11 items-center justify-center rounded-full hover:bg-secondary"><ArrowLeft className="size-5" /></Dialog.Close>
        <div className="text-center">
          <Dialog.Title className="font-hand text-3xl">我们的合照</Dialog.Title>
          <Dialog.Description className="mt-1 text-xs text-muted-foreground">{photos.length ? `${photos.length} 个一起被记住的瞬间` : '把我们，留在同一张照片里'}</Dialog.Description>
        </div>
        <button type="button" aria-label="添加合照" onClick={() => setEditor({ photo: null })} className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground"><Plus className="size-5" /></button>
      </header>

      {error && <div role="alert" className="my-6 rounded-xl border border-primary/30 p-4 text-sm"><p>{error.message}</p><button type="button" onClick={() => mutate()} className="mt-2 min-h-11 text-primary underline">重新加载</button></div>}
      {isLoading && <p role="status" className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />正在把回忆挂上来…</p>}
      {!isLoading && !error && photos.length === 0 && (
        <div className="flex min-h-[65dvh] flex-col items-center justify-center gap-5 text-center">
          <div className="photo-print -rotate-6 bg-paper px-6 pb-8 pt-6"><div className="flex h-36 w-32 items-center justify-center bg-secondary"><Camera className="size-12 text-primary/60" strokeWidth={1} /></div></div>
          <div><h2 className="font-serif text-2xl">第一张，就从我们开始。</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">一次散步，一场旅行，或者普通的一天。<br />照片和那天的故事，都可以放在这里。</p></div>
          <button type="button" onClick={() => setEditor({ photo: null })} className="min-h-11 rounded-full bg-primary px-6 text-sm text-primary-foreground">放上第一张合照</button>
        </div>
      )}
      {photos.length > 0 && <div className="photo-wall-grid grid grid-cols-2 items-start gap-x-5 gap-y-8 px-1 py-8">
        {photos.map((photo) => (
          <button key={photo.id} type="button" aria-label={`查看合照故事：${photo.title || '一起的瞬间'}`} onClick={() => { setSelected(photo); setDeleteError(null) }} className="photo-print min-w-0 bg-paper p-2.5 pb-4 text-left transition-transform active:scale-95">
            <StorageImage pathname={photo.pathname} alt={photo.title || '我们的合照'} loading="lazy" className="aspect-[4/5] w-full bg-secondary object-cover" />
            <span className="mt-3 block truncate font-serif text-sm">{photo.title || '一起的瞬间'}</span>
            <span className="mt-1 block text-[10px] text-muted-foreground">{photo.date.replaceAll('-', '.')}</span>
          </button>
        ))}
      </div>}

      <PhotoStory photo={selected} onClose={() => setSelected(null)}>
        {selected?.author === me && <div className="mt-8 flex justify-center gap-4 border-t border-foreground/15 pt-4">
          <button type="button" disabled={deleting} onClick={() => { setEditor({ photo: selected }); setSelected(null) }} className="flex min-h-11 items-center gap-2 px-2 text-sm"><Pencil className="size-4" />编辑故事</button>
          <button type="button" disabled={deleting} onClick={() => remove(selected)} className="flex min-h-11 items-center gap-2 px-2 text-sm opacity-70"><Trash2 className="size-4" />{deleting ? '移除中…' : '取下合照'}</button>
        </div>}
        {deleteError && <p role="alert" className="text-center text-sm">{deleteError}</p>}
      </PhotoStory>
      {editor && <PhotoComposer photo={editor.photo} onClose={() => setEditor(null)} onSaved={(photo) => { setEditor(null); setSelected(photo); mutate() }} />}
    </div>
  )
}

function PhotoStory({ photo, onClose, children }: { photo: SharedPhoto | null; onClose: () => void; children: React.ReactNode }) {
  const [turned, setTurned] = useState(false)
  useEffect(() => setTurned(false), [photo?.id])
  return (
    <Dialog.Root open={photo !== null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop forceRender className="photo-viewer-backdrop fixed inset-0 z-[60]">
          {photo && <StorageImage pathname={photo.pathname} alt="" aria-hidden="true" />}
        </Dialog.Backdrop>
        <Dialog.Popup className="fixed inset-0 z-[60] overflow-y-auto text-foreground outline-none">
          {photo && <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
            <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
              <span className="font-serif text-sm opacity-70">{photo.date.replaceAll('-', ' / ')}</span>
              <Dialog.Close aria-label="收起照片" className="flex size-11 items-center justify-center rounded-full border border-foreground/10 bg-background/50"><X className="size-5" /></Dialog.Close>
            </div>
            <div className="photo-perspective px-3 py-3">
              <button type="button" aria-label="轻点照片切换立体角度" data-turned={turned} onClick={() => setTurned((value) => !value)}
                onPointerMove={(event) => {
                  if (event.pointerType !== 'mouse' && !event.buttons) return
                  const bounds = event.currentTarget.getBoundingClientRect()
                  event.currentTarget.style.setProperty('--photo-rx', `${-(event.clientY - bounds.top - bounds.height / 2) / bounds.height * 12}deg`)
                  event.currentTarget.style.setProperty('--photo-ry', `${(event.clientX - bounds.left - bounds.width / 2) / bounds.width * 14}deg`)
                }}
                onPointerLeave={(event) => { event.currentTarget.style.removeProperty('--photo-rx'); event.currentTarget.style.removeProperty('--photo-ry') }}
                onPointerUp={(event) => { event.currentTarget.style.removeProperty('--photo-rx'); event.currentTarget.style.removeProperty('--photo-ry') }}
                onPointerCancel={(event) => { event.currentTarget.style.removeProperty('--photo-rx'); event.currentTarget.style.removeProperty('--photo-ry') }}
                className="photo-3d w-full touch-pan-y bg-paper p-3 pb-7">
                <StorageImage pathname={photo.pathname} alt={photo.title || '我们的合照'} className="max-h-[48dvh] w-full object-contain" />
              </button>
            </div>
            <p className="mt-4 text-center text-[11px] opacity-55">轻点照片，换一个角度</p>
            <div className="mt-8 font-serif">
              <Dialog.Title className="break-words text-2xl leading-relaxed">{photo.title || '一起的瞬间'}</Dialog.Title>
              <Dialog.Description className="sr-only">这张合照背后的故事</Dialog.Description>
              <p className="mt-5 whitespace-pre-wrap break-words text-[18px] leading-[2]">{photo.story || '这一页故事，等我们慢慢写。'}</p>
              <p className="mt-6 text-xs opacity-50">{PARTNERS[photo.author].name}留下的瞬间</p>
            </div>
            {children}
          </div>}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function PhotoComposer({ photo, onClose, onSaved }: { photo: SharedPhoto | null; onClose: () => void; onSaved: (photo: SharedPhoto) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [pathname, setPathname] = useState(photo?.pathname ?? '')
  const [title, setTitle] = useState(photo?.title ?? '')
  const [date, setDate] = useState(photo?.date ?? todayInChina())
  const [story, setStory] = useState(photo?.story ?? '')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const busy = useRef(false)
  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  const dirty = file !== null || title !== (photo?.title ?? '') || story !== (photo?.story ?? '') || date !== (photo?.date ?? todayInChina())

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError(null)
    try {
      let uploaded = pathname
      if (!uploaded) {
        if (!file) throw new Error('先选一张你们的合照吧')
        if (file.size > 8 * 1024 * 1024) throw new Error('照片不能超过 8MB，请换一张小一点的')
        uploaded = await uploadImage(file, 'photos')
        setPathname(uploaded)
      }
      const data = await photoRequest('/api/photos', { method: photo ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: photo?.id, pathname: uploaded, date, title, story }) })
      onSaved(data.photo)
    } catch (err) {
      setError(err instanceof Error ? err.message : '没有保存成功，请重试')
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  return (
    <PaperDialog open onOpenChange={(open) => {
      if (!open && !busy.current && (!dirty || window.confirm('还没保存，要先放下这段故事吗？'))) onClose()
    }} title={photo ? '写写那天的故事' : '放上一张合照'} description="一张照片，一段只有我们知道的故事。">
      <form onSubmit={save} className="flex flex-col gap-4">
        {photo ? <StorageImage pathname={photo.pathname} alt="正在编辑的合照" className="max-h-40 w-full object-contain" /> : <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-secondary/50 p-3 text-sm text-muted-foreground">
          {preview ? <img src={preview} alt="待上传的合照预览" className="max-h-40 w-full object-contain" /> : <><Camera className="size-7 text-primary" /><span>选一张我们的合照</span><span className="text-xs">JPG / PNG / WebP / GIF，最大 8MB</span></>}
          <input type="file" aria-label="选择合照" accept="image/jpeg,image/png,image/webp,image/gif" disabled={pending} className="sr-only" onChange={(event) => { const selected = event.target.files?.[0]; if (selected) { setFile(selected); setPathname(''); setError(null) } }} />
        </label>}
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">照片的名字<input value={title} disabled={pending} maxLength={MAX_PHOTO_TITLE} onChange={(event) => setTitle(event.target.value)} placeholder="比如：那天的晚风" className="min-h-11 w-full border-b bg-transparent font-serif text-lg text-foreground outline-none focus:border-primary" /></label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">拍摄日期<input type="date" required value={date} max={todayInChina()} disabled={pending} onChange={(event) => setDate(event.target.value)} className="min-h-11 w-full min-w-0 border-b bg-transparent text-base text-foreground outline-none focus:border-primary" /></label>
        <label className="flex flex-col gap-2 text-xs text-muted-foreground">这张照片的故事<textarea value={story} disabled={pending} maxLength={MAX_PHOTO_STORY} onChange={(event) => setStory(event.target.value)} rows={5} placeholder="那一天，我们……" className="w-full resize-y rounded-lg border bg-background p-3 font-serif text-lg leading-8 text-foreground outline-none focus:border-primary" /></label>
        <span className="text-right text-xs text-muted-foreground">{story.length} / {MAX_PHOTO_STORY}</span>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <button type="submit" disabled={pending || (!photo && !file)} className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{pending && <Loader2 className="size-4 animate-spin" />}{pending ? '正在收好…' : photo ? '保存故事' : '挂到合照墙上'}</button>
      </form>
    </PaperDialog>
  )
}
