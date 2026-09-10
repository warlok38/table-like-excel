import type { CellTable } from '../types'
import { getTableCellKey } from './cell-key'

export function makeTableStructureKey(data: CellTable[][]): string {
  return JSON.stringify(
    data.map((row, rowIndex) =>
      row.map((cell, cellIndex) => [
        getTableCellKey(cell, rowIndex, cellIndex),
        cell.data.rowspan,
        cell.data.colspan
      ])
    )
  )
}
