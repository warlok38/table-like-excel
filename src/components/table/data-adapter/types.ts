import type { AvailableBackgroundColor, CellTable, CellValue } from '@/types'

export type TableValueChange = {
  cellKey: string
  value: CellValue
}

export type TableBackgroundChange = {
  cellKey: string
  background: string | null
}

export type TableNoteChange = {
  cellKey: string
  note: string | null
}

export type TableSaveChangeset = {
  values: TableValueChange[]
  backgrounds: TableBackgroundChange[]
  notes: TableNoteChange[]
}

export type LoadedTableSnapshot = {
  data: CellTable[][]
  availableBackgroundColors: AvailableBackgroundColor[]
}

export type TableDataAdapter = {
  load: () => Promise<LoadedTableSnapshot>
  saveChanges: (changeset: TableSaveChangeset) => Promise<LoadedTableSnapshot>
}
