import type { ThemeConfig } from 'antd'

import { buttonTheme } from './button'
import { tableTheme } from './table'

type ComponentOverrides = NonNullable<ThemeConfig['components']>

export const componentOverrides: ComponentOverrides = {
  Button: buttonTheme,
  Table: tableTheme
}
