'use client'

import { memo, useCallback, useMemo, useRef } from 'react'
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
  manualBackground: string | null
  noteValue: string | null
  isNoteOpen: boolean
  isActive: boolean
  isSelected: boolean
  isLocked: boolean
  onSelect: (cellKey: string, options: { append: boolean }) => void
  onExtendSelection: (cellKey: string) => void
  onOpenNote: (cellKey: string) => void
  onCloseNote: () => void
  onNoteChange: (cellKey: string, value: string) => void
  onContextMenu: (cellKey: string, position: { x: number; y: number }) => void
}

function TableCell({
  cell,
  cellKey,
  rowIndex,
  cellIndex,
  manualBackground,
  noteValue,
  isNoteOpen,
  isActive,
  isSelected,
  isLocked,
  onSelect,
  onExtendSelection,
  onOpenNote,
  onCloseNote,
  onNoteChange,
  onContextMenu
}: TableCellProps) {
  const tdRef = useRef<HTMLTableCellElement>(null)
  const hasNote = Boolean(noteValue?.trim())

  const style = useMemo(() => getCellStyle(cell, manualBackground), [cell, manualBackground])
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
  const handleClick = useCallback(() => {
    if (hasNote) {
      onOpenNote(cellKey)
    }
  }, [cellKey, hasNote, onOpenNote])
  const handleContextMenu = useCallback(
    (event: React.MouseEvent<HTMLTableCellElement>) => {
      event.preventDefault()
      onSelect(cellKey, { append: false })
      onContextMenu(cellKey, { x: event.clientX, y: event.clientY })
    },
    [cellKey, onContextMenu, onSelect]
  )
  const handleNoteChange = useCallback(
    (value: string) => onNoteChange(cellKey, value),
    [cellKey, onNoteChange]
  )

  return (
    <td
      ref={tdRef}
      className={cn(styles.td, {
        [styles.constCellComments]: cell.data.comments_id,
        [styles.selectedCell]: isSelected,
        [styles.activeCell]: isActive,
        [styles.lockedCell]: isLocked,
        [styles.selectedLockedCell]: isSelected && isLocked,
        [styles.noteCell]: hasNote
      })}
      colSpan={cell.data.colspan}
      rowSpan={cell.data.rowspan}
      style={style}
      data-row={rowIndex}
      data-col={cellIndex}
      aria-selected={isSelected}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      <div
        className={cn(styles.constCell, {
          [styles.nowrap]: isNumericCellValue(cell.formatted_value)
        })}
      >
        {formatCellValue(cell.formatted_value)}
      </div>
      {isNoteOpen && (
        <DataStatusNote
          value={noteValue ?? ''}
          anchorRef={tdRef}
          onClose={onCloseNote}
          onChange={handleNoteChange}
          readOnly={isLocked}
        />
      )}
    </td>
  )
}

export const MemoTableCell = memo(TableCell)
