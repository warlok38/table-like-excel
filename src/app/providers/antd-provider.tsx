'use client'

import { App as AntdApp, ConfigProvider } from 'antd'
import ruRU from 'antd/locale/ru_RU'
import type { ReactNode } from 'react'

import { themeConfig } from '@/shared/theme'

type AntdProviderProps = {
  children: ReactNode
}

export function AntdProvider({ children }: AntdProviderProps) {
  return (
    <ConfigProvider locale={ruRU} theme={themeConfig}>
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  )
}
