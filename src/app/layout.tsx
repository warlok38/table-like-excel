import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Table Like Excel',
  description: 'Base Next.js project'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
