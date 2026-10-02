import type { ThemeConfig } from 'antd'

type ButtonTheme = NonNullable<NonNullable<ThemeConfig['components']>['Button']>

export const buttonTheme: ButtonTheme = {
  primaryColor: '#172033',
  colorPrimary: '#F5C400',
  colorPrimaryHover: '#E2B500',
  colorPrimaryActive: '#C79F00'
}
