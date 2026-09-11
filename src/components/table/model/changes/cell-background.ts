import type { CellTable } from '../../types'

export function getDataStatusBackground(cell: CellTable): string | null {
  const values =
    cell.data_status?.background
      ?.map((item) => item.value)
      .filter((value): value is string => Boolean(value)) ?? []

  if (values.length === 0) return null
  if (values.length === 1) return values[0]

  return `linear-gradient(to right, ${values.join(', ')})`
}

export function getLoadedBackground(cell: CellTable): string | null {
  return getDataStatusBackground(cell) ?? cell.data.color ?? null
}
