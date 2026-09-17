import type { CellEditor, CellTable, CellValue, DataStatus } from '@/components/Table'

const columnCount = 12
const totalRowCount = 500
const mergedBodyRowStarts = new Set([120, 260, 420])

const attentionStatus: DataStatus = {
  data_statuses_tech_id: 'virtualized-table-status',
  background: [
    {
      alias: 'Внимание',
      value: '#fff3bf',
      tech_id: 'virtualized-table-background'
    }
  ],
  note: {
    alias: 'Примечание',
    value: 'Контрольная ячейка большой виртуализированной таблицы.'
  }
}

function makeLargeTableCell(
  row: number,
  col: number,
  value: CellValue,
  options: {
    colspan?: number
    rowspan?: number
    editable?: boolean
    editor?: CellEditor | null
    dataStatus?: DataStatus | null
    color?: string | null
  } = {}
): CellTable {
  return {
    label: null,
    data: {
      id: `virtualized-table-${row}-${col}`,
      row,
      col,
      colspan: options.colspan ?? 1,
      rowspan: options.rowspan ?? 1,
      color: options.color ?? null,
      field: options.editor?.type === 'textarea' ? 'comment' : 'text',
      comments_id: null,
      parameter_id: null,
      catalogs_id: null,
      editable: options.editable ?? true,
      editor: options.editor ?? { type: 'text' }
    },
    value,
    formatted_value: value,
    data_status: options.dataStatus ?? null
  }
}

function makeBodyRow(rowIndex: number): CellTable[] {
  const row = rowIndex + 1
  const cells: CellTable[] = []
  const mergedStart = mergedBodyRowStarts.has(rowIndex)
  const mergedContinuation =
    mergedBodyRowStarts.has(rowIndex - 1) || mergedBodyRowStarts.has(rowIndex - 2)

  if (!mergedContinuation) {
    cells.push(
      makeLargeTableCell(row, 1, mergedStart ? `Группа ${row}–${row + 2}` : `Строка ${row}`, {
        rowspan: mergedStart ? 3 : 1,
        editable: false,
        editor: { type: 'readonly' },
        color: mergedStart ? '#dbeafe' : '#ffffff'
      })
    )
  }

  for (let col = 2; col <= columnCount; col += 1) {
    const multiline = col === 2 && rowIndex % 23 === 0
    const value = multiline
      ? `Показатель ${row}\nДополнительная строка для проверки высоты`
      : `R${row} C${col}`
    cells.push(
      makeLargeTableCell(row, col, value, {
        editor: multiline ? { type: 'textarea' } : { type: 'text' },
        dataStatus: rowIndex === 3 && col === 2 ? attentionStatus : null,
        color: rowIndex % 2 === 0 ? '#ffffff' : '#f9fafb'
      })
    )
  }

  return cells
}

export const virtualizedTableDataMock: CellTable[][] = [
  [
    makeLargeTableCell(1, 1, 'Виртуализированная таблица: 500 строк', {
      colspan: columnCount,
      editable: false,
      editor: { type: 'readonly' },
      color: '#dbeafe'
    })
  ],
  Array.from({ length: columnCount }, (_, columnIndex) =>
    makeLargeTableCell(2, columnIndex + 1, `Колонка ${columnIndex + 1}`, {
      editable: false,
      editor: { type: 'readonly' },
      color: '#f3f4f6'
    })
  ),
  ...Array.from({ length: totalRowCount - 2 }, (_, index) => makeBodyRow(index + 2))
]
