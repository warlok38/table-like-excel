import type {
  CellEditor,
  CellPermissions,
  CellTable,
  CellValue,
  DataStatus
} from '@/components/table'

type DemoCellOptions = {
  editable?: boolean | null
  editor?: CellEditor | null
  permissions?: CellPermissions | null
  formattedValue?: CellValue
  dataStatus?: DataStatus | null
  colspan?: number
}

const noteStatus = (value: string): DataStatus => ({
  note: {
    alias: 'Примечание',
    value
  }
})

const labelCell = (id: string, row: number, value: string): CellTable => ({
  label: null,
  value,
  formatted_value: value,
  data: {
    id,
    row,
    col: 1,
    rowspan: 1,
    colspan: 1,
    editable: false
  },
  data_status: null
})

const valueCell = (
  id: string,
  row: number,
  value: CellValue,
  options: DemoCellOptions = {}
): CellTable => ({
  label: null,
  value,
  formatted_value: options.formattedValue === undefined ? value : options.formattedValue,
  data: {
    id,
    row,
    col: 2,
    rowspan: 1,
    colspan: options.colspan ?? 1,
    ...('editable' in options ? { editable: options.editable } : {}),
    ...('editor' in options ? { editor: options.editor } : {}),
    ...('permissions' in options ? { permissions: options.permissions } : {})
  },
  data_status: options.dataStatus ?? null
})

const mergedValueCell = (
  id: string,
  row: number,
  value: CellValue,
  options: DemoCellOptions = {}
): CellTable => ({
  label: null,
  value,
  formatted_value: options.formattedValue === undefined ? value : options.formattedValue,
  data: {
    id,
    row,
    col: 1,
    rowspan: 1,
    colspan: 2,
    ...('editable' in options ? { editable: options.editable } : {}),
    ...('editor' in options ? { editor: options.editor } : {}),
    ...('permissions' in options ? { permissions: options.permissions } : {})
  },
  data_status: options.dataStatus ?? null
})

export const editorModelDataMock: CellTable[][] = [
  [
    labelCell('phase8-text-label', 1, 'Текст'),
    valueCell('phase8-text-value', 1, 'Смена А', {
      editor: { type: 'text', maxLength: 100 }
    })
  ],
  [
    labelCell('phase8-textarea-label', 2, 'Многострочный текст'),
    valueCell('phase8-textarea-value', 2, 'Первая строка\nВторая строка', {
      editor: { type: 'textarea', maxLength: 1000 }
    })
  ],
  [
    labelCell('phase8-number-label', 3, 'Число'),
    valueCell('phase8-number-value', 3, 12.5, {
      editor: { type: 'number', min: 0, max: 100, step: 0.1 }
    })
  ],
  [
    labelCell('phase8-select-label', 4, 'Выбор'),
    valueCell('phase8-select-value', 4, 'ok', {
      formattedValue: 'Подтверждено',
      editor: {
        type: 'select',
        options: [
          { value: 'ok', label: 'Подтверждено' },
          { value: 'review', label: 'Проверить' }
        ]
      }
    })
  ],
  [
    labelCell('phase8-date-label', 5, 'Дата'),
    valueCell('phase8-date-value', 5, '2026-09-09', {
      formattedValue: '09.09.2026',
      editor: {
        type: 'date',
        min: '2026-01-01',
        max: '2026-12-31',
        displayFormat: 'DD.MM.YYYY'
      }
    })
  ],
  [
    labelCell('phase8-no-editor-label', 6, 'Без редактора'),
    valueCell('phase8-no-editor-value', 6, 'Только действия')
  ],
  [
    labelCell('phase8-readonly-actions-label', 7, 'Readonly с действиями'),
    valueCell('phase8-readonly-actions-value', 7, 'Расчёт', {
      editor: { type: 'readonly' },
      dataStatus: noteStatus('Можно изменить примечание')
    })
  ],
  [
    labelCell('phase8-editable-false-label', 8, 'Общий запрет'),
    valueCell('phase8-editable-false-value', 8, 'Заблокировано', {
      editable: false,
      editor: { type: 'text' },
      permissions: { value: true, background: true, note: true },
      dataStatus: noteStatus('Только просмотр')
    })
  ],
  [
    labelCell('phase8-background-only-label', 9, 'Только заливка'),
    valueCell('phase8-background-only-value', 9, 'Цвет', {
      permissions: { note: false }
    })
  ],
  [
    labelCell('phase8-note-only-label', 10, 'Только примечание'),
    valueCell('phase8-note-only-value', 10, 'Примечание', {
      permissions: { background: false }
    })
  ],
  [
    labelCell('phase8-value-only-label', 11, 'Только значение'),
    valueCell('phase8-value-only-value', 11, 'Значение', {
      editor: { type: 'text' },
      permissions: { background: false, note: false }
    })
  ],
  [
    labelCell('phase8-all-permissions-false-label', 12, 'Все права запрещены'),
    valueCell('phase8-all-permissions-false-value', 12, 'Нет действий', {
      editor: { type: 'text' },
      permissions: { value: false, background: false, note: false }
    })
  ],
  [
    labelCell('phase8-value-forbidden-label', 13, 'Запрет значения'),
    valueCell('phase8-value-forbidden-value', 13, 'Без изменения значения', {
      editor: { type: 'text' },
      permissions: { value: false }
    })
  ],
  [
    labelCell('phase8-null-metadata-label', 14, 'Пустые метаданные'),
    valueCell('phase8-null-metadata-value', 14, null, {
      formattedValue: null,
      editable: null,
      editor: null,
      permissions: null
    })
  ],
  [
    labelCell('phase8-defaults-label', 15, 'Значения по умолчанию'),
    valueCell('phase8-defaults-value', 15, 'По умолчанию')
  ],
  [
    labelCell('phase8-readonly-locked-label', 16, 'Readonly без действий'),
    valueCell('phase8-readonly-locked-value', 16, 'Закрыто', {
      editor: { type: 'readonly' },
      permissions: { background: false, note: false }
    })
  ],
  [
    labelCell('phase9-number-minmax-label', 17, 'Число 10-100'),
    valueCell('phase9-number-minmax-value', 17, 50, {
      editor: { type: 'number', min: 10, max: 100, step: 0.1 }
    })
  ],
  [
    labelCell('phase9-number-free-label', 18, 'Число без границ'),
    valueCell('phase9-number-free-value', 18, 12.3456, {
      editor: { type: 'number', step: 0.1 }
    })
  ],
  [
    labelCell('phase9-text-max-label', 19, 'Текст maxLength=5'),
    valueCell('phase9-text-max-value', 19, 'abc', {
      editor: { type: 'text', maxLength: 5 }
    })
  ],
  [
    labelCell('phase9-empty-text-label', 20, 'Пустой текст'),
    valueCell('phase9-empty-text-value', 20, null, {
      formattedValue: null,
      editor: { type: 'text', maxLength: 100 }
    })
  ],
  [
    labelCell('phase9-empty-textarea-label', 21, 'Пустой textarea'),
    valueCell('phase9-empty-textarea-value', 21, null, {
      formattedValue: null,
      editor: { type: 'textarea', maxLength: 1000 }
    })
  ],
  [
    labelCell('phase9-empty-select-label', 22, 'Пустой select'),
    valueCell('phase9-empty-select-value', 22, null, {
      formattedValue: null,
      editor: {
        type: 'select',
        options: [
          { value: 'planned', label: 'Запланировано' },
          { value: 'done', label: 'Готово' },
          { value: 'blocked', label: 'Заблокировано' }
        ]
      }
    })
  ],
  [
    labelCell('phase9-empty-date-label', 23, 'Пустая дата'),
    valueCell('phase9-empty-date-value', 23, null, {
      formattedValue: null,
      editor: {
        type: 'date',
        min: '2024-02-01',
        max: '2026-12-31',
        displayFormat: 'DD.MM.YYYY'
      }
    })
  ],
  [
    labelCell('phase9-select-empty-options-label', 24, 'Select без вариантов'),
    valueCell('phase9-select-empty-options-value', 24, null, {
      formattedValue: null,
      editor: { type: 'select', options: [] }
    })
  ],
  [
    mergedValueCell('phase9-merged-editable-value', 25, 'Редактируемая объединённая ячейка', {
      editor: { type: 'text', maxLength: 120 },
      dataStatus: noteStatus('Проверка маркера на объединённой ячейке')
    })
  ]
]
