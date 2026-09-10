import type { CellTable } from '../types'

export type CellSelectionEntry = {
  key: string
  row: number
  col: number
  cell: CellTable
}

export function getTableCellKey(cell: CellTable, rowIndex: number, cellIndex: number): string {
  return cell.data.id ?? `${rowIndex + 1}:${cellIndex + 1}:${cell.data.row}:${cell.data.col}`
}

export const makeCellKey = getTableCellKey

export function makeCellSelectionEntries(data: CellTable[][]): CellSelectionEntry[] {
  return data.flatMap((row, rowIndex) =>
    row.map((cell, cellIndex) => ({
      key: getTableCellKey(cell, rowIndex, cellIndex),
      row: cell.data.row,
      col: cell.data.col,
      cell
    }))
  )
}

export function getCellKeysInRange(
  entries: CellSelectionEntry[],
  fromKey: string,
  toKey: string
): string[] {
  const fromCell = entries.find((entry) => entry.key === fromKey)
  const toCell = entries.find((entry) => entry.key === toKey)

  if (!fromCell || !toCell) {
    return []
  }

  const minRow = Math.min(fromCell.row, toCell.row)
  const maxRow = Math.max(fromCell.row, toCell.row)
  const minCol = Math.min(fromCell.col, toCell.col)
  const maxCol = Math.max(fromCell.col, toCell.col)

  return entries
    .filter(
      (entry) =>
        entry.row >= minRow && entry.row <= maxRow && entry.col >= minCol && entry.col <= maxCol
    )
    .map((entry) => entry.key)
}
