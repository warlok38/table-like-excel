import type { CellTable } from '@/components/Table'

export type BackendFiltersCell = Record<string, string | number | boolean | null | undefined>

export type BackendDataStatus = {
  data_statuses_tech_id?: string
  requiresNoteAfterValueChange?: boolean
  background?: Array<{
    alias: string | null
    value: string | null
    tech_id: string | null
  }> | null
  note?: {
    alias: string
    value: string
  } | null
}

export type BackendValSettings = {
  table_name: string | null
  val_field_name: string | null
  json_attrib_name: string | null
  fk_table_name: string | null
  fk_field_name: string | null
}

export type BackendTableCell = {
  label: string | null
  data: {
    col: number
    row: number
    colspan: number
    rowspan: number
    color?: string | null
    field?: string | null
    comments_id?: string | null
    parameter_id?: string | null
    catalogs_id?: string | null
    interval?: string | null
    time_format?: string | null
    timestamp?: string | null
    change_mode?: string | null
    editable?: boolean | null
    changed?: boolean
    filters?: BackendFiltersCell | null
    val_settings?: BackendValSettings
    tdata_id?: string | null
    shift_approved?: boolean
    production_date?: string | null
    event_datetime?: string | null
    repeat_rec?: boolean
    rounding?: number | null
    production_period?: unknown[] | null
    properties_journal_tech_id?: string | null
    vector?: unknown | null
  }
  formatted_value: number | string | null
  chart_data?: unknown | null
  chart_svg?: string | null
  vector_meta?: unknown | null
  data_status: BackendDataStatus | null
}

export function mapBackendTableData(rows: BackendTableCell[][]): CellTable[][] {
  return rows.map((row) => row.map(mapBackendTableCell))
}

function mapBackendTableCell(backendCell: BackendTableCell): CellTable {
  return {
    ...backendCell,
    data: {
      ...backendCell.data,
      field: 'text',
      editor: backendCell.data.editable === true ? { type: 'text' } : null
    },
    value: backendCell.label
  }
}
