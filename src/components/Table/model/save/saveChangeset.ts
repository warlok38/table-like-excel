import type { TableSaveChangeset } from '../table'
import type { PendingChanges } from '../changes/pendingChanges'
import type { TableCellEntry } from '../data/tableIndex'

export function makeSaveChangeset(
  changes: PendingChanges,
  entriesByKey: Map<string, TableCellEntry>
): TableSaveChangeset {
  const getTarget = (cellKey: string) => {
    const entry = entriesByKey.get(cellKey)
    if (!entry) throw new Error(`Ячейка ${cellKey} отсутствует в данных таблицы`)

    return { cellKey, row: entry.cell.data.row, col: entry.cell.data.col }
  }

  return {
    values: Object.entries(changes.values).map(([cellKey, value]) => ({
      target: getTarget(cellKey),
      value
    })),
    backgrounds: Object.entries(changes.backgrounds).map(([cellKey, background]) => ({
      target: getTarget(cellKey),
      background
    })),
    notes: Object.entries(changes.notes).map(([cellKey, note]) => ({
      target: getTarget(cellKey),
      note
    }))
  }
}
