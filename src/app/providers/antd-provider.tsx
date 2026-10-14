'use client'

import { App as AntdApp, ConfigProvider } from 'antd'
import { StyleProvider, px2remTransformer } from '@ant-design/cssinjs'
import ruRU from 'antd/locale/ru_RU'
import type { ReactNode } from 'react'

import { themeConfig } from '@/shared/theme'

type AntdProviderProps = {
  children: ReactNode
}

const remTransformers = [px2remTransformer({ rootValue: 19.2, precision: 4 })]

export function AntdProvider({ children }: AntdProviderProps) {
  return (
    <StyleProvider transformers={remTransformers}>
      <ConfigProvider locale={ruRU} theme={themeConfig}>
        <AntdApp message={{ top: '0.4167rem' }}>{children}</AntdApp>
      </ConfigProvider>
    </StyleProvider>
  )
}
