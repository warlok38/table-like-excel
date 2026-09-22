import type { Metadata } from 'next'

import { FeatureNavigation } from './feature-navigation'
import './globals.css'

export const metadata: Metadata = {
  title: 'Testing features',
  description: 'Экспериментальные реализации таблиц'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body>
        <FeatureNavigation />
        {children}
      </body>
    </html>
  )
}
