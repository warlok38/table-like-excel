'use client'

import type { PropsWithChildren } from 'react'

import { AntdProvider } from './antd-provider'
import { StoreProvider } from './store-provider'

export function Providers({ children }: PropsWithChildren) {
  return (
    <AntdProvider>
      <StoreProvider>{children}</StoreProvider>
    </AntdProvider>
  )
}
