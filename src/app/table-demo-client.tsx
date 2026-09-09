'use client'

import { useMemo } from 'react'

import { Table } from '@/components/table/table'
import { createMockTableDataAdapter } from '@/components/table/data-adapter/mock-table-data-adapter'
import { useTableDataAdapter } from '@/components/table/data-adapter/use-table-data-adapter'
import type { TableDataAdapter } from '@/components/table/data-adapter/types'
import type { AvailableBackgroundColor, CellTable } from '@/types'

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

  return (
    <section>
      {title && <h2>{title}</h2>}
      {description && <p>{description}</p>}
      {tableState.status === 'loading' && <p>Загрузка таблицы...</p>}
      {tableState.status === 'error' && <p role="alert">{tableState.error}</p>}
      {tableState.status === 'ready' && (
        <>
          <p>Доступно цветов заливки: {tableState.snapshot.availableBackgroundColors.length}</p>
          <Table
            data={tableState.snapshot.data}
            availableBackgroundColors={tableState.snapshot.availableBackgroundColors}
            onSaveChanges={tableState.saveChanges}
          />
        </>
      )}
    </section>
  )
}
