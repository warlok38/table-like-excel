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
import { createMockTableDataAdapter } from '@/mocks/table/mock-table-data-adapter'
import { availableBackgroundColorsMock, virtualizedTableDataMock } from '@/mocks/table'

const emptyTableData: CellTable[][] = []
const emptyBackgroundColors: AvailableBackgroundColor[] = []

export default function Home() {
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
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#111827' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #d1d5db',
          background: '#ffffff'
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', lineHeight: 1.2 }}>Table Like Excel</h1>
        {isReady && <TableHeaderActions model={table.headerActions} />}
      </header>
      <main style={{ padding: '1.5rem' }}>
        {tableState.status === 'loading' && <p>Загрузка таблицы...</p>}
        {tableState.status === 'error' && <p role="alert">{tableState.error}</p>}
        {isReady && <TableSurface controller={table} />}
      </main>
    </div>
  )
}
