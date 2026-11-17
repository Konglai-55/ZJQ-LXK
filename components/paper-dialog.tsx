'use client'

import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  className?: string
  children: React.ReactNode
}

/** A centred paper card dialog. Positioned with inset-0 + margin auto so it never depends on page flow. */
export function PaperDialog({ open, onOpenChange, title, description, className, children }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          forceRender
          className="fixed inset-0 z-[60] bg-foreground/40 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0"
        />
        <Dialog.Popup
          className={cn(
            'paper-shadow fixed! inset-0 z-[70] m-auto flex h-fit max-h-[calc(100dvh-2rem)] w-[min(92vw,24rem)] flex-col gap-4 overflow-y-auto rounded-2xl border-2 border-dashed border-primary/40 bg-paper p-6 outline-none transition-[opacity,scale] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <Dialog.Title className="font-hand text-3xl leading-tight">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="text-pretty text-sm leading-relaxed text-muted-foreground">
                  {description}
                </Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label="关闭"
              className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-secondary"
            >
              <X className="size-4" aria-hidden="true" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
