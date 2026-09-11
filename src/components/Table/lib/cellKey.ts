import type { CellTable } from '../model/table'

export function getTableCellKey(cell: CellTable, rowIndex: number, cellIndex: number): string {
  return cell.data.id ?? `${rowIndex + 1}:${cellIndex + 1}:${cell.data.row}:${cell.data.col}`
}
