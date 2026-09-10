import type { CellTable } from '../types'

export function formatCellValue(value: CellTable['formatted_value']): string {
  if (value === null) return ''
  if (typeof value === 'number') return new Intl.NumberFormat('ru-RU').format(value)

  return value
}

export function isNumericCellValue(value: CellTable['formatted_value']): boolean {
  return value !== null && value !== '' && !Number.isNaN(Number(value))
}
