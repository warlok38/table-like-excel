'use client'
import type { TableProps } from './types'
import { useTableController } from './model/use-table-controller'
import { TableView } from './ui/table-view'
export function Table(props: TableProps) {
  const view = useTableController(props)
  return <TableView {...view} />
}
