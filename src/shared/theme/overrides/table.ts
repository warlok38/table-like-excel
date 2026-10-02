import type { ThemeConfig } from 'antd'

type TableTheme = NonNullable<NonNullable<ThemeConfig['components']>['Table']>

export const tableTheme: TableTheme = {
  headerBg: '#F4F6F8',
  headerColor: '#344054'
}
