import type { CellEditor, CellPermissions, CellValue } from './cell-editor'

export type * from './cell-editor'

export type CellField = 'text' | 'number' | 'comment' | 'vector'

export type FiltersCell = Record<string, string | number | boolean | null | undefined>

export type CellTable = {
  label: null | string
  data: {
    id?: string | null
    col: number
    row: number
    colspan: number
    rowspan: number
    color?: string | null
    field?: CellField | null
    comments_id?: string | null
    parameter_id?: string | null
    catalogs_id?: string | null
    interval?: string | null
    time_format?: string | null
    timestamp?: string | null
    change_mode?: string | null
    editable?: boolean | null
    editor?: CellEditor | null
    permissions?: CellPermissions | null
    changed?: boolean
    filters?: FiltersCell | null
    tdata_id?: string | null
    shift_approved?: boolean
    production_date?: string | null
    event_datetime?: string | null
    repeat_rec?: boolean
    production_period?: unknown[] | null
    properties_journal_tech_id?: string | null
  }
  value: CellValue
  formatted_value: number | string | null
  chart_data?: unknown | null
  chart_svg?: string | null
  data_status: DataStatus | null
}

export type DataStatus = {
  data_statuses_tech_id?: string
  background?: BackgroundDataStatusItem[] | null
  note?: {
    alias: string
    value: string
  } | null
}

export type BackgroundDataStatusItem = {
  alias: string | null
  value: string | null
  tech_id: string | null
}

export type AvailableBackgroundColor = {
  alias: string
  value: string | null
  tech_id: string
}

export type ShiftRange = {
  shift_start: string
  shift_end: string
}
