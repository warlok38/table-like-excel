import type { AvailableBackgroundColor, CellTable, CellValue } from '@/types'
import { formatPendingValue } from '../editing/value-conversion'
import { makeCellKey } from '../helpers'
import type { LoadedTableSnapshot, TableDataAdapter, TableSaveChangeset } from './types'

type MockTableDataAdapterOptions = {
  data: CellTable[][]
  availableBackgroundColors: AvailableBackgroundColor[]
  saveDelayMs?: number
  failNextSave?: boolean
}

export function createMockTableDataAdapter({
  data,
  availableBackgroundColors,
  saveDelayMs = 300,
  failNextSave = false
}: MockTableDataAdapterOptions): TableDataAdapter {
  let snapshot: LoadedTableSnapshot = {
    data,
    availableBackgroundColors
  }
  let shouldFailNextSave = failNextSave

  return {
    async loadTableData() {
      return snapshot.data
    },
    async loadAvailableBackgroundColors() {
      return snapshot.availableBackgroundColors
    },
    async saveChanges(changeset) {
      await delay(saveDelayMs)

      if (shouldFailNextSave) {
        shouldFailNextSave = false
        throw new Error('Mock table save failed')
      }

      snapshot = {
        ...snapshot,
        data: applyChangeset(snapshot.data, changeset)
      }

      return snapshot
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function applyChangeset(data: CellTable[][], changeset: TableSaveChangeset): CellTable[][] {
  const values = new Map(
    changeset.values.map((change) => [change.target.cellKey, change.value] as const)
  )
  const backgrounds = new Map(
    changeset.backgrounds.map((change) => [change.target.cellKey, change.background] as const)
  )
  const notes = new Map(
    changeset.notes.map((change) => [change.target.cellKey, change.note] as const)
  )

  return data.map((row, rowIndex) =>
    row.map((cell, cellIndex) => {
      const cellKey = makeCellKey(cell, rowIndex, cellIndex)
      let nextCell = cell

      if (values.has(cellKey)) {
        nextCell = applyValueChange(nextCell, values.get(cellKey) ?? null)
      }

      if (backgrounds.has(cellKey)) {
        nextCell = {
          ...nextCell,
          data: {
            ...nextCell.data,
            color: backgrounds.get(cellKey) ?? null
          }
        }
      }

      if (notes.has(cellKey)) {
        const note = notes.get(cellKey) ?? null
        nextCell = {
          ...nextCell,
          data_status: {
            ...(nextCell.data_status ?? {}),
            note: note && note.length > 0 ? { alias: 'Примечание', value: note } : null
          }
        }
      }

      return nextCell
    })
  )
}

function applyValueChange(cell: CellTable, value: CellValue): CellTable {
  const editor = cell.data.editor
  const formattedValue =
    editor && editor.type !== 'readonly' ? formatPendingValue(value, editor) : String(value ?? '')

  return {
    ...cell,
    value,
    formatted_value: formattedValue
  }
}
