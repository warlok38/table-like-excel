import type { CellTable } from '../../types'
import { getTableCellKey } from '../../lib/cell-key'

export type TableCellEntry = {
  key: string
  rowIndex: number
  cellIndex: number
  row: number
  col: number
  cell: CellTable
}

export function makeTableEntries(data: CellTable[][]): TableCellEntry[] {
  return data.flatMap((row, rowIndex) =>
    row.map((cell, cellIndex) => ({
      key: getTableCellKey(cell, rowIndex, cellIndex),
      rowIndex,
      cellIndex,
      row: cell.data.row,
      col: cell.data.col,
      cell
    }))
  )
}

export function makeEntriesByKey(entries: TableCellEntry[]): Map<string, TableCellEntry> {
  return new Map(entries.map((entry) => [entry.key, entry] as const))
}
