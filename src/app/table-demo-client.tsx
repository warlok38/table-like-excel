'use client'

import { useMemo } from 'react'

import { Table, type AvailableBackgroundColor, type CellTable } from '@/components/table'
import { useTableDataAdapter } from '@/integrations/table/use-table-data-adapter'
import type { TableDataAdapter } from '@/integrations/table/types'
import { createMockTableDataAdapter } from '@/mocks/table/mock-table-data-adapter'

type TableDemoClientProps = {
  title?: string
  description?: string
  data: CellTable[][]
  availableBackgroundColors: AvailableBackgroundColor[]
}

export function TableDemoClient({
  title,
  description,
  data,
  availableBackgroundColors
}: TableDemoClientProps) {
  const adapter = useMemo(
    () =>
      createMockTableDataAdapter({
        data,
        availableBackgroundColors
      }),
    [availableBackgroundColors, data]
  )

  return <TableDemoFromAdapter title={title} description={description} adapter={adapter} />
}

type TableDemoFromAdapterProps = {
  title?: string
  description?: string
  adapter: TableDataAdapter
}

function TableDemoFromAdapter({ title, description, adapter }: TableDemoFromAdapterProps) {
  const tableState = useTableDataAdapter(adapter)
  const hasDataStatus =
    tableState.status === 'ready' &&
    tableState.snapshot.data.some((row) =>
      row.some((cell) => cell.data_status !== null && cell.data_status !== undefined)
    )

  return (
    <section>
      {title && <h2>{title}</h2>}
      {description && <p>{description}</p>}
      {tableState.status === 'loading' && <p>Загрузка таблицы...</p>}
      {tableState.status === 'error' && <p role="alert">{tableState.error}</p>}
      {tableState.status === 'ready' && (
        <>
          {hasDataStatus && (
            <p>Доступно цветов заливки: {tableState.snapshot.availableBackgroundColors.length}</p>
          )}
          <Table
            data={tableState.snapshot.data}
            availableBackgroundColors={tableState.snapshot.availableBackgroundColors}
            cellManagementEnabled={hasDataStatus}
            onSaveChanges={tableState.saveChanges}
          />
        </>
      )}
    </section>
  )
}
