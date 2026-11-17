'use client'

import { PaperDialog } from '@/components/paper-dialog'
import type { Capsule } from '@/hooks/use-capsules'
import { formatDateZh } from '@/lib/calendar'
import { PARTNERS } from '@/lib/partners'

type Props = { capsule: Capsule | null; open: boolean; onOpenChange: (open: boolean) => void }

export function CapsuleReader({ capsule, open, onOpenChange }: Props) {
  if (!capsule) return null
  const author = capsule.mine ? '我' : PARTNERS[capsule.author].name
  const written = capsule.createdAt.slice(0, 10)

  return (
    <PaperDialog
      open={open}
      onOpenChange={onOpenChange}
      title={capsule.title || '一封时间胶囊'}
      description={`${author}写于 ${formatDateZh(written).full}，${formatDateZh(capsule.openDate).full}拆开`}
      className="w-[min(94vw,28rem)]"
    >
      <div className="paper-grain paper-shadow relative -rotate-[0.5deg] rounded-sm bg-paper pb-5 pt-8">
        <div aria-hidden="true" className="absolute -top-2.5 left-8 h-6 w-20 -rotate-3 bg-tape" />
        <p className="paper-lined min-h-72 whitespace-pre-wrap break-words pl-12 pr-5 font-hand text-2xl leading-9">
          {capsule.content}
        </p>
      </div>
    </PaperDialog>
  )
}
