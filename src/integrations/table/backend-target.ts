import type { CellTable, TableSaveChangeset } from '@/components/table'
import { getTableCellKey } from '@/components/table'

export type TableCellBackendIdentifiers = {
  id: string | null
  commentsId: string | null
  parameterId: string | null
  catalogsId: string | null
  dataStatusTechId: string | null
  tdataId: string | null
  propertiesJournalTechId: string | null
}

export type BackendTableCellTarget = {
  cellKey: string
  row: number
  col: number
  identifiers: TableCellBackendIdentifiers
}

export type BackendTableSaveChangeset = {
  values: Array<{
    target: BackendTableCellTarget
    value: TableSaveChangeset['values'][number]['value']
  }>
  backgrounds: Array<{
    target: BackendTableCellTarget
    background: string | null
  }>
  notes: Array<{ target: BackendTableCellTarget; note: string | null }>
}

export function attachBackendIdentifiers(
  changeset: TableSaveChangeset,
  data: CellTable[][]
): BackendTableSaveChangeset {
  const entriesByKey = new Map(
    data.flatMap((row, rowIndex) =>
      row.map((cell, cellIndex) => [getTableCellKey(cell, rowIndex, cellIndex), cell] as const)
    )
  )

  const attachTarget = (cellKey: string): BackendTableCellTarget => {
    const cell = entriesByKey.get(cellKey)
    if (!cell) throw new Error(`Ячейка ${cellKey} отсутствует в данных таблицы`)

    return {
      cellKey,
      row: cell.data.row,
      col: cell.data.col,
      identifiers: {
        id: cell.data.id ?? null,
        commentsId: cell.data.comments_id ?? null,
        parameterId: cell.data.parameter_id ?? null,
        catalogsId: cell.data.catalogs_id ?? null,
        dataStatusTechId: cell.data_status?.data_statuses_tech_id ?? null,
        tdataId: cell.data.tdata_id ?? null,
        propertiesJournalTechId: cell.data.properties_journal_tech_id ?? null
      }
    }
  }

  return {
    values: changeset.values.map((change) => ({
      ...change,
      target: attachTarget(change.target.cellKey)
    })),
    backgrounds: changeset.backgrounds.map((change) => ({
      ...change,
      target: attachTarget(change.target.cellKey)
    })),
    notes: changeset.notes.map((change) => ({
      ...change,
      target: attachTarget(change.target.cellKey)
    }))
  }
}
