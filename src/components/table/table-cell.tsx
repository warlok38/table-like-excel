'use client'

import {
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject
} from 'react'
import { createPortal } from 'react-dom'
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
  onCloseNote: () => void
  onNoteChange: (cellKey: string, value: string) => void
  onContextMenu: (cellKey: string, position: { x: number; y: number }) => void
}

type NoteTooltipProps = {
  value: string
  anchorRef: RefObject<HTMLElement>
}

function NoteTooltip({ value, anchorRef }: NoteTooltipProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    const anchor = anchorRef.current
    if (!anchor) {
      return
    }

    const rect = anchor.getBoundingClientRect()
    setPosition({
      top: rect.top,
      left: rect.right + 2
    })
  }, [anchorRef])

  if (!position) return null

  return createPortal(
    <div className={styles.noteTooltip} style={{ top: position.top, left: position.left }}>
      {value}
    </div>,
    document.body
  )
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
  onCloseNote,
  onNoteChange,
  onContextMenu
}: TableCellProps) {
  const tdRef = useRef<HTMLTableCellElement>(null)
  const hasNote = Boolean(noteValue?.trim())
  const [isNoteTooltipOpen, setIsNoteTooltipOpen] = useState(false)

  const style = useMemo(() => getCellStyle(cell, manualBackground), [cell, manualBackground])
  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLTableCellElement>) => {
      event.preventDefault()
      onSelect(cellKey, { append: event.ctrlKey || event.metaKey })
    },
    [cellKey, onSelect]
  )
  const handleMouseEnter = useCallback(() => {
    onExtendSelection(cellKey)

    if (hasNote && !isNoteOpen) {
      setIsNoteTooltipOpen(true)
    }
  }, [cellKey, hasNote, isNoteOpen, onExtendSelection])
  const handleMouseLeave = useCallback(() => setIsNoteTooltipOpen(false), [])
  const handleContextMenu = useCallback(
    (event: React.MouseEvent<HTMLTableCellElement>) => {
      event.preventDefault()
      setIsNoteTooltipOpen(false)
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
      onMouseLeave={handleMouseLeave}
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
      {hasNote && isNoteTooltipOpen && !isNoteOpen && (
        <NoteTooltip value={noteValue ?? ''} anchorRef={tdRef} />
      )}
    </td>
  )
}

export const MemoTableCell = memo(TableCell)
