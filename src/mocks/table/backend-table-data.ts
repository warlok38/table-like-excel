import {
  mapBackendTableData,
  type BackendTableCell,
  type BackendValSettings
} from '@/integrations/table/backend-table-data'

const demoFilters = {
  plan_types_tech_id: 'plan-type-demo',
  aggregation_levels_tech_id: 'aggregation-level-demo',
  shifts_tech_id: 'shift-demo',
  shift_parts_tech_id: 'shift-part-demo',
  aggregation_rules_tech_id: 'aggregation-rule-demo',
  periods_tech_id: null
}

const alternateDemoFilters = {
  ...demoFilters,
  aggregation_rules_tech_id: 'aggregation-rule-alternate-demo'
}

const demoValSettings: BackendValSettings = {
  table_name: null,
  val_field_name: null,
  json_attrib_name: null,
  fk_table_name: null,
  fk_field_name: null
}

type BackendCellMockOptions = {
  row: number
  col: number
  label: string
  formattedValue: string
  editable: boolean
  parameterId: string
  tdataId: string | null
  changeMode: string | null
  dataStatus: BackendTableCell['data_status']
  useAlternateFilters?: boolean
}

function makeBackendCellMock({
  row,
  col,
  label,
  formattedValue,
  editable,
  parameterId,
  tdataId,
  changeMode,
  dataStatus,
  useAlternateFilters = false
}: BackendCellMockOptions): BackendTableCell {
  return {
    label,
    data: {
      col,
      row,
      colspan: 1,
      rowspan: 1,
      color: null,
      field: 'parameter',
      comments_id: null,
      parameter_id: parameterId,
      catalogs_id: null,
      interval: null,
      time_format: null,
      timestamp: '2025-01-14T20:00:00+07:00',
      change_mode: changeMode,
      editable,
      changed: false,
      filters: useAlternateFilters ? alternateDemoFilters : demoFilters,
      val_settings: demoValSettings,
      tdata_id: tdataId,
      shift_approved: true,
      production_date: '2025-01-15',
      event_datetime: '2025-01-14T20:00:00+07:00',
      repeat_rec: false,
      rounding: null,
      production_period: null,
      properties_journal_tech_id: null,
      vector: null
    },
    formatted_value: formattedValue,
    chart_data: null,
    chart_svg: null,
    vector_meta: null,
    data_status: dataStatus
  }
}

export const backendTableDataMock: BackendTableCell[][] = [
  [
    makeBackendCellMock({
      row: 1,
      col: 1,
      label: '10.123456789',
      formattedValue: '10.12',
      editable: false,
      parameterId: 'parameter-demo-01',
      tdataId: 'tdata-demo-01',
      changeMode: 'source',
      dataStatus: null
    }),
    makeBackendCellMock({
      row: 1,
      col: 2,
      label: '20.234567891',
      formattedValue: '20.23',
      editable: false,
      parameterId: 'parameter-demo-02',
      tdataId: 'tdata-demo-02',
      changeMode: 'source',
      dataStatus: { note: null }
    }),
    makeBackendCellMock({
      row: 1,
      col: 3,
      label: '30.345678912',
      formattedValue: '30.35',
      editable: false,
      parameterId: 'parameter-demo-03',
      tdataId: 'tdata-demo-03',
      changeMode: 'source',
      dataStatus: { background: null }
    }),
    makeBackendCellMock({
      row: 1,
      col: 4,
      label: '40.456789123',
      formattedValue: '40.46',
      editable: false,
      parameterId: 'parameter-demo-04',
      tdataId: 'tdata-demo-04',
      changeMode: 'source',
      dataStatus: { background: null, note: null }
    })
  ],
  [
    makeBackendCellMock({
      row: 2,
      col: 1,
      label: '1.1',
      formattedValue: '1.10',
      editable: true,
      parameterId: 'parameter-demo-05',
      tdataId: 'tdata-demo-05',
      changeMode: 'source',
      dataStatus: { background: null, note: null }
    }),
    makeBackendCellMock({
      row: 2,
      col: 2,
      label: '2.2',
      formattedValue: '2.20',
      editable: true,
      parameterId: 'parameter-demo-06',
      tdataId: 'tdata-demo-06',
      changeMode: 'source',
      dataStatus: { background: null, note: null }
    }),
    makeBackendCellMock({
      row: 2,
      col: 3,
      label: '-',
      formattedValue: '-',
      editable: true,
      parameterId: 'parameter-demo-07',
      tdataId: null,
      changeMode: 'source',
      dataStatus: { background: null, note: null }
    }),
    makeBackendCellMock({
      row: 2,
      col: 4,
      label: '-',
      formattedValue: '-',
      editable: true,
      parameterId: 'parameter-demo-08',
      tdataId: null,
      changeMode: 'source',
      dataStatus: { background: null, note: null }
    })
  ],
  [
    makeBackendCellMock({
      row: 3,
      col: 1,
      label: '-',
      formattedValue: '-',
      editable: true,
      parameterId: 'parameter-demo-09',
      tdataId: null,
      changeMode: null,
      dataStatus: { background: null, note: null },
      useAlternateFilters: true
    }),
    makeBackendCellMock({
      row: 3,
      col: 2,
      label: '-',
      formattedValue: '-',
      editable: true,
      parameterId: 'parameter-demo-10',
      tdataId: null,
      changeMode: null,
      dataStatus: { background: null, note: null },
      useAlternateFilters: true
    }),
    makeBackendCellMock({
      row: 3,
      col: 3,
      label: '-',
      formattedValue: '-',
      editable: true,
      parameterId: 'parameter-demo-11',
      tdataId: null,
      changeMode: null,
      dataStatus: { background: null, note: null },
      useAlternateFilters: true
    }),
    makeBackendCellMock({
      row: 3,
      col: 4,
      label: '-',
      formattedValue: '-',
      editable: true,
      parameterId: 'parameter-demo-12',
      tdataId: null,
      changeMode: null,
      dataStatus: { background: null, note: null },
      useAlternateFilters: true
    })
  ],
  [
    makeBackendCellMock({
      row: 4,
      col: 1,
      label: '100.0',
      formattedValue: '100.00',
      editable: true,
      parameterId: 'parameter-demo-13',
      tdataId: 'tdata-demo-13',
      changeMode: 'manual',
      dataStatus: { background: null, note: null }
    }),
    makeBackendCellMock({
      row: 4,
      col: 2,
      label: '200.0',
      formattedValue: '200.00',
      editable: true,
      parameterId: 'parameter-demo-14',
      tdataId: 'tdata-demo-14',
      changeMode: 'manual',
      dataStatus: { background: null, note: null }
    }),
    makeBackendCellMock({
      row: 4,
      col: 3,
      label: '-',
      formattedValue: '-',
      editable: true,
      parameterId: 'parameter-demo-15',
      tdataId: null,
      changeMode: 'manual',
      dataStatus: { background: null, note: null }
    }),
    makeBackendCellMock({
      row: 4,
      col: 4,
      label: '300.0',
      formattedValue: '300.00',
      editable: true,
      parameterId: 'parameter-demo-16',
      tdataId: 'tdata-demo-16',
      changeMode: 'manual',
      dataStatus: { background: null, note: null }
    })
  ]
]

export const mappedBackendTableDataMock = mapBackendTableData(backendTableDataMock)
