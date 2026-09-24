import type { ThemeConfig } from 'antd'

import { buttonTheme } from './button'
import { formTheme } from './form'
import { tableTheme } from './table'

type ComponentOverrides = NonNullable<ThemeConfig['components']>

export const componentOverrides: ComponentOverrides = {
  Button: buttonTheme,
  Form: formTheme,
  Table: tableTheme
}
