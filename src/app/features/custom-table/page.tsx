'use client'

import { useMemo } from 'react'

import {
  TableHeaderActions,
  TableSurface,
  useTableController,
  type AvailableBackgroundColor,
  type CellTable
} from '@/components/Table'
import { useTableDataAdapter } from '@/integrations/table/use-table-data-adapter'
import { availableBackgroundColorsMock, virtualizedTableDataMock } from '@/mocks/table'
import { createMockTableDataAdapter } from '@/mocks/table/mock-table-data-adapter'

import styles from './page.module.css'

const emptyTableData: CellTable[][] = []
const emptyBackgroundColors: AvailableBackgroundColor[] = []

export default function CustomTablePage() {
  const adapter = useMemo(
    () =>
      createMockTableDataAdapter({
        data: virtualizedTableDataMock,
        availableBackgroundColors: availableBackgroundColorsMock
      }),
    []
  )
  const tableState = useTableDataAdapter(adapter)
  const isReady = tableState.status === 'ready'
  const data = isReady ? tableState.snapshot.data : emptyTableData
  const availableBackgroundColors = isReady
    ? tableState.snapshot.availableBackgroundColors
    : emptyBackgroundColors
  const cellManagementEnabled = data.some((row) =>
    row.some((cell) => cell.data_status !== null && cell.data_status !== undefined)
  )
  const table = useTableController({
    data,
    availableBackgroundColors,
    cellManagementEnabled,
    onSaveChanges: tableState.saveChanges
  })

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Фича 1</p>
          <h1 className={styles.title}>Table Like Excel</h1>
        </div>
        {isReady && <TableHeaderActions model={table.headerActions} />}
      </header>
      <main className={styles.content}>
        {tableState.status === 'loading' && <p>Загрузка таблицы...</p>}
        {tableState.status === 'error' && <p role="alert">{tableState.error}</p>}
        {isReady && <TableSurface controller={table} />}
      </main>
    </div>
  )
}
