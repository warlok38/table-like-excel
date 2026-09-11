import type { CellTable } from '../types'

export function getTableCellKey(cell: CellTable, rowIndex: number, cellIndex: number): string {
  return cell.data.id ?? `${rowIndex + 1}:${cellIndex + 1}:${cell.data.row}:${cell.data.col}`
}

export const makeCellKey = getTableCellKey
