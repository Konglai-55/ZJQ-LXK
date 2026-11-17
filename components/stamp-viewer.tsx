'use client'

import { Dialog } from '@base-ui/react/dialog'
import { useEffect, useState } from 'react'
import { StorageImage } from '@/components/storage-image'
import { tiltFor } from '@/lib/diary-images'

const PERF = 12

/** Full-screen view of one stamp; tap anywhere to put it back. */
export function StampViewer({ pathname, onClose }: { pathname: string | null; onClose: () => void }) {
  const [size, setSize] = useState({ W: 300, H: 372 })

  useEffect(() => {
    if (!pathname) return
    const fit = () => {
      const maxW = Math.min(window.innerWidth * 0.86, 520)
      const maxH = window.innerHeight * 0.78
      let W = Math.floor(maxW / PERF) * PERF
      let H = Math.round((W * 1.25) / PERF) * PERF
      if (H > maxH) {
        H = Math.floor(maxH / PERF) * PERF
        W = Math.round(H / 1.25 / PERF) * PERF
      }
      setSize({ W, H })
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [pathname])

  return (
    <Dialog.Root open={pathname !== null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop
          forceRender
          className="photo-viewer-backdrop fixed inset-0 z-[80] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0"
        >
          {pathname && <StorageImage pathname={pathname} alt="" aria-hidden="true" />}
        </Dialog.Backdrop>
        <Dialog.Popup
          onClick={onClose}
          className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-5 outline-none transition data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0"
        >
          <Dialog.Title className="sr-only">邮票大图</Dialog.Title>
          {pathname && (
            <div className="stamp-shadow-lifted" style={{ width: size.W, height: size.H, rotate: `${tiltFor(pathname) / 2}deg` }}>
              <div className="stamp-edge flex size-full bg-card p-4">
                <div className="flex-1 overflow-hidden border border-foreground/15">
                  <StorageImage pathname={pathname} alt="日记照片大图" className="size-full object-cover" />
                </div>
              </div>
            </div>
          )}
          <p className="font-hand text-xl text-foreground">轻点任意处收起</p>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
