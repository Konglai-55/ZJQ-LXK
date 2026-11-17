import { redirect } from 'next/navigation'
import { ChooseForm } from '@/components/choose-form'
import { getCurrentPartner } from '@/lib/identity'
import { getLockHash } from '@/lib/lock'

export default async function ChoosePage() {
  if (await getCurrentPartner()) redirect('/')

  const [jiaqi, xikun] = await Promise.all([getLockHash('jiaqi'), getLockHash('xikun')])

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="paper-grain paper-shadow relative w-full max-w-md -rotate-1 rounded-sm bg-paper px-7 pb-9 pt-12">
        <div aria-hidden="true" className="absolute -top-3 left-1/2 h-7 w-28 -translate-x-1/2 rotate-2 bg-tape" />
        <div className="flex rotate-1 flex-col gap-8">
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-balance text-center font-hand text-4xl leading-tight">
              梁熙坤 <span className="text-primary">&amp;</span> 祝佳琪
            </h1>
            <p className="text-sm text-muted-foreground">我们的恋爱日历 · 你是谁呀？</p>
          </div>
          <ChooseForm locked={{ jiaqi: Boolean(jiaqi), xikun: Boolean(xikun) }} />
        </div>
      </div>
    </main>
  )
}
