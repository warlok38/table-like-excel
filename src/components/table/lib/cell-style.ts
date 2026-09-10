import type { CSSProperties } from 'react'
import type { CellTable } from '../types'

export function getCellStyle(
  cell: CellTable,
  manualBackground: string | null | undefined = undefined
): CSSProperties {
  const dataStatusBackground = getDataStatusBackground(cell)
  const background =
    manualBackground !== undefined
      ? (manualBackground ?? '#ffffff')
      : (dataStatusBackground ?? cell.data.color ?? '#ffffff')

  if (background.includes('gradient')) {
    return {
      background,
      color: '#111827'
    }
  }

  return {
    backgroundColor: background,
    color: getContrastColor(background)
  }
}

export function getDataStatusBackground(cell: CellTable): string | null {
  const values =
    cell.data_status?.background
      ?.map((item) => item.value)
      .filter((value): value is string => Boolean(value)) ?? []

  if (values.length === 0) return null
  if (values.length === 1) return values[0]

  return `linear-gradient(to right, ${values.join(', ')})`
}

function getContrastColor(backgroundColor: string): string {
  const normalized = backgroundColor.replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return '#111827'

  const red = parseInt(normalized.slice(0, 2), 16)
  const green = parseInt(normalized.slice(2, 4), 16)
  const blue = parseInt(normalized.slice(4, 6), 16)
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000

  return brightness > 150 ? '#111827' : '#ffffff'
}
