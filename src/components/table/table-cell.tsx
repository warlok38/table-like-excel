'use client'

import { memo, useCallback, useMemo, useRef, useState } from 'react'
import cn from 'classnames'

import type { CellTable } from '@/types'
import { DataStatusNote } from './data-status/data-status-note'
import { formatCellValue, getCellStyle, isNumericCellValue } from './helpers'
import styles from './table.module.css'

type TableCellProps = {
  cell: CellTable
  cellKey: string
  rowIndex: number
  cellIndex: number
  isActive: boolean
  isSelected: boolean
  isLocked: boolean
  onSelect: (cellKey: string, options: { append: boolean }) => void
  onExtendSelection: (cellKey: string) => void
}

function TableCell({
  cell,
  cellKey,
  rowIndex,
  cellIndex,
  isActive,
  isSelected,
  isLocked,
  onSelect,
  onExtendSelection
}: TableCellProps) {
  const tdRef = useRef<HTMLTableCellElement>(null)
  const [isNoteOpen, setIsNoteOpen] = useState(false)
  const hasNote = Boolean(cell.data_status?.note?.value)

  const style = useMemo(() => getCellStyle(cell), [cell])
  const closeNote = useCallback(() => setIsNoteOpen(false), [])
  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLTableCellElement>) => {
      event.preventDefault()
      onSelect(cellKey, { append: event.ctrlKey || event.metaKey })
    },
    [cellKey, onSelect]
  )
  const handleMouseEnter = useCallback(
    () => onExtendSelection(cellKey),
    [cellKey, onExtendSelection]
  )

  return (
    <td
      ref={tdRef}
      className={cn(styles.td, {
        [styles.constCellComments]: cell.data.comments_id,
        [styles.selectedCell]: isSelected,
        [styles.activeCell]: isActive,
        [styles.lockedCell]: isLocked,
        [styles.selectedLockedCell]: isSelected && isLocked
      })}
      colSpan={cell.data.colspan}
      rowSpan={cell.data.rowspan}
      style={style}
      data-row={rowIndex}
      data-col={cellIndex}
      aria-selected={isSelected}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
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
