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

import type { CellTable, CellValue } from '@/types'
import { DataStatusNote } from './data-status/data-status-note'
import { CellValueEditor } from './editors/cell-value-editor'
import type { EditStart, EditingSession } from './editing/types'
import { getCellStyle, isNumericCellValue } from './helpers'
import styles from './table.module.css'

type TableCellProps = {
  cell: CellTable
  cellKey: string
  rowIndex: number
  cellIndex: number
  displayValue: string
  currentValue: CellValue
  manualBackground: string | null | undefined
  noteValue: string | null
  isNoteOpen: boolean
  isActive: boolean
  isSelected: boolean
  isLocked: boolean
  isValueChanged: boolean
  isCellChanged: boolean
  canEditValue: boolean
  canEditNote: boolean
  session: EditingSession | null
  tableOwnerId: string
  onSelect: (cellKey: string, options: { append: boolean }) => void
  onExtendSelection: (cellKey: string) => void
  onOpenEditor: (cellKey: string, start: EditStart) => void
  onDraftChange: (draft: string) => void
  onChooseValue: (value: CellValue) => void
  onCommitEditor: () => void
  onCancelEditor: () => void
  onFocusTable: () => void
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
  displayValue,
  currentValue,
  manualBackground,
  noteValue,
  isNoteOpen,
  isActive,
  isSelected,
  isLocked,
  isValueChanged,
  isCellChanged,
  canEditValue,
  canEditNote,
  session,
  tableOwnerId,
  onSelect,
  onExtendSelection,
  onOpenEditor,
  onDraftChange,
  onChooseValue,
  onCommitEditor,
  onCancelEditor,
  onFocusTable,
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
      if (event.button !== 0) return
      if (event.target instanceof Element && event.target.closest('[data-table-interactive]')) {
        return
      }

      event.preventDefault()
      onSelect(cellKey, { append: event.ctrlKey || event.metaKey })
      onFocusTable()
    },
    [cellKey, onFocusTable, onSelect]
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
      onFocusTable()
      onContextMenu(cellKey, { x: event.clientX, y: event.clientY })
    },
    [cellKey, onContextMenu, onFocusTable, onSelect]
  )
  const handleDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLTableCellElement>) => {
      if (!canEditValue) return
      if (event.target instanceof Element && event.target.closest('[data-table-interactive]')) {
        return
      }

      event.preventDefault()
      onOpenEditor(cellKey, { kind: 'current' })
    },
    [canEditValue, cellKey, onOpenEditor]
  )
  const handleOpenPicker = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()
      onOpenEditor(cellKey, { kind: 'current' })
    },
    [cellKey, onOpenEditor]
  )
  const handleNoteChange = useCallback(
    (value: string) => onNoteChange(cellKey, value),
    [cellKey, onNoteChange]
  )
  const hasPickerButton =
    canEditValue && (cell.data.editor?.type === 'select' || cell.data.editor?.type === 'date')
  const isEditingTextLike =
    session &&
    (session.editor.type === 'text' ||
      session.editor.type === 'textarea' ||
      session.editor.type === 'number')

  return (
    <td
      ref={tdRef}
      className={cn(styles.td, {
        [styles.constCellComments]: cell.data.comments_id,
        [styles.selectedCell]: isSelected,
        [styles.activeCell]: isActive,
        [styles.lockedCell]: isLocked,
        [styles.selectedLockedCell]: isSelected && isLocked,
        [styles.noteCell]: hasNote,
        [styles.pendingCell]: isCellChanged,
        [styles.valueChangedCell]: isValueChanged
      })}
      colSpan={cell.data.colspan}
      rowSpan={cell.data.rowspan}
      style={style}
      data-row={rowIndex}
      data-col={cellIndex}
      data-value-changed={isValueChanged || undefined}
      data-pending-changed={isCellChanged || undefined}
      aria-selected={isSelected}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className={cn(styles.constCell, {
          [styles.nowrap]: isNumericCellValue(cell.formatted_value),
          [styles.preWrap]: cell.data.editor?.type === 'textarea'
        })}
      >
        {isEditingTextLike ? null : displayValue}
        {isEditingTextLike && session && (
          <CellValueEditor
            session={session}
            currentValue={currentValue}
            anchorRef={tdRef}
            tableOwnerId={tableOwnerId}
            onDraftChange={onDraftChange}
            onChooseValue={onChooseValue}
            onCommit={onCommitEditor}
            onCancel={onCancelEditor}
          />
        )}
      </div>
      {hasPickerButton && (
        <button
          type="button"
          className={styles.valuePickerButton}
          data-table-interactive="true"
          aria-label={cell.data.editor?.type === 'date' ? 'Открыть календарь' : 'Открыть список'}
          onMouseDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
          onClick={handleOpenPicker}
        >
          {cell.data.editor?.type === 'date' ? '▦' : '▾'}
        </button>
      )}
      {session && !isEditingTextLike && (
        <CellValueEditor
          session={session}
          currentValue={currentValue}
          anchorRef={tdRef}
          tableOwnerId={tableOwnerId}
          onDraftChange={onDraftChange}
          onChooseValue={onChooseValue}
          onCommit={onCommitEditor}
          onCancel={onCancelEditor}
        />
      )}
      {isValueChanged && <span className={styles.valueChangedMarker} />}
      {isNoteOpen && (
        <DataStatusNote
          value={noteValue ?? ''}
          anchorRef={tdRef}
          tableOwnerId={tableOwnerId}
          onClose={onCloseNote}
          onChange={handleNoteChange}
          readOnly={!canEditNote}
        />
      )}
      {hasNote && isNoteTooltipOpen && !isNoteOpen && (
        <NoteTooltip value={noteValue ?? ''} anchorRef={tdRef} />
      )}
    </td>
  )
}

export const MemoTableCell = memo(TableCell)
