import './globals.css'
import type { Metadata } from 'next'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { Montserrat } from 'next/font/google'
import { FeatureNavigation } from './feature-navigation'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Testing features',
  description: 'Экспериментальные реализации таблиц'
}

const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-montserrat',
  display: 'swap'
})

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body className={montserrat.className}>
        <AntdRegistry layer>
          <Providers>
            <FeatureNavigation />
            {children}
          </Providers>
        </AntdRegistry>
      </body>
    </html>
  )
}
