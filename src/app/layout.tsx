import type { Metadata } from 'next'
import { AntdRegistry } from '@ant-design/nextjs-registry'

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
        <AntdRegistry>
          <FeatureNavigation />
          {children}
        </AntdRegistry>
      </body>
    </html>
  )
}
