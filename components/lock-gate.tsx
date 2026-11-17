'use client'

import { Lock } from 'lucide-react'
import { useState } from 'react'

type Props = { name: string; onUnlock: (password: string) => Promise<void> }

export function LockGate({ name, onUnlock }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!password) return
    setPending(true)
    setError(null)
    try {
      await onUnlock(password)
    } catch (err) {
      setError(err instanceof Error ? err.message : '密码不对哦')
      setPassword('')
    }
    setPending(false)
  }

  return (
    <form
      onSubmit={submit}
      className="paper-lined flex min-h-[26rem] flex-col items-center justify-center gap-5 px-10 py-12 text-center"
    >
      <span className="flex size-20 items-center justify-center rounded-full border-2 border-dashed border-primary bg-card text-primary">
        <Lock className="size-8" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-hand text-3xl">{name}给日记上了锁</p>
        <p className="text-sm text-muted-foreground">输对密码才能偷看哦</p>
      </div>
      <label className="sr-only" htmlFor="unlock-password">
        {name}的日记密码
      </label>
      <input
        id="unlock-password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="off"
        placeholder="输入密码"
        className="w-48 border-b-2 border-foreground/30 bg-transparent py-1.5 text-center text-lg tracking-[0.4em] outline-none transition placeholder:tracking-normal placeholder:text-muted-foreground/60 focus:border-primary"
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || !password}
        className="rounded-full bg-primary px-6 py-2 font-hand text-xl text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
      >
        {pending ? '开锁中…' : '打开看看'}
      </button>
    </form>
  )
}
