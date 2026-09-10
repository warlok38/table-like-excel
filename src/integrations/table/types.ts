import type { AvailableBackgroundColor, CellTable, TableSaveChangeset } from '@/components/table'

export type LoadedTableSnapshot = {
  data: CellTable[][]
  availableBackgroundColors: AvailableBackgroundColor[]
}

export type TableDataAdapter = {
  loadTableData: () => Promise<CellTable[][]>
  loadAvailableBackgroundColors: () => Promise<AvailableBackgroundColor[]>
  saveChanges: (changeset: TableSaveChangeset) => Promise<LoadedTableSnapshot>
}
