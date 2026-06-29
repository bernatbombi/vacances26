import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '🚐 Vacances 2026',
  description: 'Road trip map — Hungary · Slovakia · Milan',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
