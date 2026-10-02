import type { ThemeConfig } from 'antd'

type FormTheme = NonNullable<NonNullable<ThemeConfig['components']>['Form']>

export const formTheme: FormTheme = {
  verticalLabelPadding: '0 0 4px'
}
