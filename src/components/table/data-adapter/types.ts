import type { AvailableBackgroundColor, CellTable, CellValue } from '@/types'

export type TableCellBackendIdentifiers = {
  id: string | null
  commentsId: string | null
  parameterId: string | null
  catalogsId: string | null
  dataStatusTechId: string | null
  tdataId: string | null
  propertiesJournalTechId: string | null
}

export type TableCellOperationTarget = {
  cellKey: string
  row: number
  col: number
  identifiers: TableCellBackendIdentifiers
}

export type TableValueChange = {
  target: TableCellOperationTarget
  value: CellValue
}

export type TableBackgroundChange = {
  target: TableCellOperationTarget
  background: string | null
}

export type TableNoteChange = {
  target: TableCellOperationTarget
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
  loadTableData: () => Promise<CellTable[][]>
  loadAvailableBackgroundColors: () => Promise<AvailableBackgroundColor[]>
  saveChanges: (changeset: TableSaveChangeset) => Promise<LoadedTableSnapshot>
}
