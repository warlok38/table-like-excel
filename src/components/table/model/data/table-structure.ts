import type { CellTable } from '../../types'
import { getTableCellKey } from '../../lib/cell-key'

export type StructureCell = { key: string; rowSpan: number; colSpan: number }
export type TableStructure = { key: string; rows: StructureCell[][] }

export function makeTableStructure(data: CellTable[][]): TableStructure {
  const rows = data.map((row, rowIndex) =>
    row.map((cell, cellIndex) => ({
      key: getTableCellKey(cell, rowIndex, cellIndex),
      rowSpan: Math.max(1, cell.data.rowspan),
      colSpan: Math.max(1, cell.data.colspan)
    }))
  )
  return { key: JSON.stringify(rows), rows }
}
