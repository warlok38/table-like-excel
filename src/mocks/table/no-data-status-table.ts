import type { CellEditor, CellTable } from '@/types'

type NoDataStatusCellOptions = {
  color?: string
  editor?: CellEditor
  formattedValue?: string | number
}

const makeCell = (
  id: string,
  row: number,
  col: number,
  value: string | number,
  options: NoDataStatusCellOptions = {}
): CellTable => ({
  label: null,
  value,
  formatted_value: options.formattedValue ?? value,
  data: {
    id,
    row,
    col,
    rowspan: 1,
    colspan: 1,
    color: options.color ?? null,
    editable: true,
    editor: options.editor ?? (typeof value === 'number' ? { type: 'number' } : { type: 'text' })
  },
  data_status: null
})

export const noDataStatusTableMock: CellTable[][] = [
  [
    makeCell('no-status-r1-c1', 1, 1, 'А1', {
      color: '#dbeafe'
    }),
    makeCell('no-status-r1-c2', 1, 2, 'Б1'),
    makeCell('no-status-r1-c3', 1, 3, 'planned', {
      formattedValue: 'План',
      editor: {
        type: 'select',
        options: [
          { value: 'planned', label: 'План' },
          { value: 'done', label: 'Факт' }
        ]
      }
    }),
    makeCell('no-status-r1-c4', 1, 4, 120),
    makeCell('no-status-r1-c5', 1, 5, 'Готово')
  ],
  [
    makeCell('no-status-r2-c1', 2, 1, 'А2'),
    makeCell('no-status-r2-c2', 2, 2, 'Обычный текст', {
      editor: { type: 'text', maxLength: 80 }
    }),
    makeCell('no-status-r2-c3', 2, 3, 140),
    makeCell('no-status-r2-c4', 2, 4, 160),
    makeCell('no-status-r2-c5', 2, 5, 'План')
  ],
  [
    makeCell('no-status-r3-c1', 3, 1, 'А3'),
    makeCell('no-status-r3-c2', 3, 2, 'Б3'),
    makeCell('no-status-r3-c3', 3, 3, 180),
    makeCell('no-status-r3-c4', 3, 4, 200),
    makeCell('no-status-r3-c5', 3, 5, 'Факт')
  ]
]
