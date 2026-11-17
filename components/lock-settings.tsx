'use client'

import { Dialog } from '@base-ui/react/dialog'
import { Lock, LockOpen, X } from 'lucide-react'
import { useState } from 'react'
import { useLock } from '@/hooks/use-lock'
import { cn } from '@/lib/utils'

export function LockSettings({ compact = false }: { compact?: boolean }) {
  const { status, setPassword, removePassword } = useLock()
  const [open, setOpen] = useState(false)
  const [password, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const locked = Boolean(status?.mine)

  function reset(next: boolean) {
    setOpen(next)
    setPw('')
    setConfirm('')
    setError(null)
  }

  async function run(action: () => Promise<void>) {
    setPending(true)
    setError(null)
    try {
      await action()
      reset(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '出错了')
    }
    setPending(false)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 4) return setError('密码至少 4 位')
    if (password !== confirm) return setError('两次输入的不一样')
    run(() => setPassword(password))
  }

  const inputClass =
    'w-full border-b-2 border-border bg-transparent py-2 text-lg tracking-[0.3em] outline-none transition placeholder:tracking-normal placeholder:text-muted-foreground/60 focus:border-primary'

  return (
    <Dialog.Root open={open} onOpenChange={reset}>
      <Dialog.Trigger
        aria-label={locked ? '日记已上锁，修改密码' : '给日记上锁'}
        className={cn(
          'flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full text-sm transition',
          compact ? 'size-10 shrink-0' : 'border px-3 py-1.5',
          locked
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-dashed border-foreground/30 hover:border-primary hover:text-primary',
        )}
      >
        {locked ? <Lock className="size-3.5" aria-hidden="true" /> : <LockOpen className="size-3.5" aria-hidden="true" />}
        {!compact && <span>{locked ? '已上锁' : '给日记上锁'}</span>}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop forceRender className="fixed inset-0 z-[60] bg-foreground/40 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="paper-grain paper-shadow fixed! inset-0 z-[70] m-auto flex h-fit max-h-[calc(100dvh-2rem)] w-[min(92vw,24rem)] flex-col gap-5 overflow-y-auto rounded-2xl border-2 border-dashed border-primary/40 bg-paper p-6 outline-none transition-[opacity,scale] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="font-hand text-3xl">{locked ? '换一把锁' : '给日记上把锁'}</Dialog.Title>
              <Dialog.Description className="text-pretty text-sm leading-relaxed text-muted-foreground">
                上锁后，对方要输入这个密码才能看你的日记；用你的名字进入日历时也需要它。
              </Dialog.Description>
            </div>
            <Dialog.Close aria-label="关闭" className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-secondary">
              <X className="size-4" aria-hidden="true" />
            </Dialog.Close>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{locked ? '新密码' : '密码'}</span>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPw(e.target.value)}
                minLength={4}
                maxLength={64}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">再输一次</span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                maxLength={64}
                className={inputClass}
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex items-center justify-between gap-3 pt-1">
              {locked ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(removePassword)}
                  className="text-sm text-muted-foreground underline-offset-4 hover:text-destructive hover:underline disabled:opacity-40"
                >
                  不锁了
                </button>
              ) : (
                <span />
              )}
              <button
                type="submit"
                disabled={pending || !password}
                className="rounded-full bg-primary px-6 py-2 font-hand text-xl text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
              >
                {pending ? '稍等…' : locked ? '换锁' : '锁上'}
              </button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
