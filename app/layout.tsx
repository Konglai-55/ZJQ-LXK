import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Ma_Shan_Zheng, Noto_Serif_SC } from 'next/font/google'
import './globals.css'

const maShanZheng = Ma_Shan_Zheng({
  weight: '400',
  subsets: ['latin'],
  preload: false,
  variable: '--font-ma-shan-zheng',
})

const notoSerifSC = Noto_Serif_SC({
  weight: ['400', '600'],
  subsets: ['latin'],
  preload: false,
  variable: '--font-noto-serif-sc',
})

export const metadata: Metadata = {
  title: '熙坤与佳琪 · 我们的小日子',
  description: '梁熙坤和祝佳琪的两人手账。记录心情、收藏合照，把每一张照片背后的故事留在这里。',
  applicationName: '我们的小日子',
  icons: {
    icon: [
      { url: '/icon.svg?v=2', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png?v=2',
  },
}

export const viewport: Viewport = {
  viewportFit: 'cover',
  colorScheme: 'light',
  themeColor: '#fbfaf6',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className={`bg-background ${maShanZheng.variable} ${notoSerifSC.variable}`}>
      <body className="antialiased">
        <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
          <filter id="hand-drawn">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
            <feDisplacementMap in="SourceGraphic" scale="4.5" />
          </filter>
        </svg>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
