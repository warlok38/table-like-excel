import type { Metadata } from 'next'
import { AntdRegistry } from '@ant-design/nextjs-registry'

import { FeatureNavigation } from './feature-navigation'
import { StoreProvider } from './providers/store-provider'
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
          <StoreProvider>
            <FeatureNavigation />
            {children}
          </StoreProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}
