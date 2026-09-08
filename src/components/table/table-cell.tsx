'use client'

import { memo, useCallback, useMemo, useRef, useState } from 'react'
import cn from 'classnames'

import type { CellTable } from '@/types'
import { DataStatusNote } from './data-status/data-status-note'
import { formatCellValue, getCellStyle, isNumericCellValue } from './helpers'
import styles from './table.module.css'

type TableCellProps = {
  cell: CellTable
  rowIndex: number
  cellIndex: number
}

function TableCell({ cell, rowIndex, cellIndex }: TableCellProps) {
  const tdRef = useRef<HTMLTableCellElement>(null)
  const [isNoteOpen, setIsNoteOpen] = useState(false)
  const hasNote = Boolean(cell.data_status?.note?.value)

  const style = useMemo(() => getCellStyle(cell), [cell])
  const closeNote = useCallback(() => setIsNoteOpen(false), [])

  return (
    <td
      ref={tdRef}
      className={cn(styles.td, { [styles.constCellComments]: cell.data.comments_id })}
      colSpan={cell.data.colspan}
      rowSpan={cell.data.rowspan}
      style={style}
      data-row={rowIndex}
      data-col={cellIndex}
      onClick={hasNote ? () => setIsNoteOpen((value) => !value) : undefined}
    >
      <div
        className={cn(styles.constCell, {
          [styles.nowrap]: isNumericCellValue(cell.formatted_value)
        })}
      >
        {formatCellValue(cell.formatted_value)}
      </div>
      {hasNote && isNoteOpen && (
        <DataStatusNote
          note={cell.data_status?.note?.value ?? null}
          anchorRef={tdRef}
          onClose={closeNote}
        />
      )}
    </td>
  )
}

export const MemoTableCell = memo(TableCell)
