'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState, type RefCallback } from 'react'
import cn from 'classnames'

import type { CellTable, CellValue, EditStart, EditingSession } from '../../model'
import { CellValueEditor } from '../CellValueEditor/CellValueEditor'
import { DataStatusNote } from '../DataStatusNote/DataStatusNote'
import type { CellContentSize } from '../TableGrid/tableLayout'
import { getCellStyle } from './cellStyle'
import styles from './TableCell.module.css'

function isNumericCellValue(value: CellTable['formatted_value']): boolean {
  return value !== null && value !== '' && !Number.isNaN(Number(value))
}

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
  contentSize?: CellContentSize
  registerCellRef: (cellKey: string) => RefCallback<HTMLTableCellElement>
  isValueChanged: boolean
  isCellChanged: boolean
  canEditValue: boolean
  canEditNote: boolean
  canUseDataStatusActions: boolean
  isSaving: boolean
  session: EditingSession | null
  tableOwnerId: string
  onSelect: (cellKey: string, options: { append: boolean }) => void
  onExtendSelection: (cellKey: string) => void
  onOpenEditor: (cellKey: string, start: EditStart) => void
  onDraftChange: (draft: string) => void
  onChooseValue: (value: CellValue) => void
  onCommitEditor: () => void
  onCancelEditor: () => void
  onNavigateEditorByTab: (backward: boolean) => boolean
  onFocusTable: () => void
  onCloseNote: () => void
  onNoteChange: (cellKey: string, value: string) => void
  onContextMenu: (cellKey: string, position: { x: number; y: number }) => void
}

function TableCellComponent({
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
  contentSize,
  registerCellRef,
  isValueChanged,
  isCellChanged,
  canEditValue,
  canEditNote,
  canUseDataStatusActions,
  isSaving,
  session,
  tableOwnerId,
  onSelect,
  onExtendSelection,
  onOpenEditor,
  onDraftChange,
  onChooseValue,
  onCommitEditor,
  onCancelEditor,
  onNavigateEditorByTab,
  onFocusTable,
  onCloseNote,
  onNoteChange,
  onContextMenu
}: TableCellProps) {
  const tdRef = useRef<HTMLTableCellElement | null>(null)
  const externalCellRef = registerCellRef(cellKey)
  const setTdRef = useCallback(
    (element: HTMLTableCellElement | null) => {
      tdRef.current = element
      externalCellRef(element)
    },
    [externalCellRef]
  )
  const hasNote = Boolean(noteValue?.trim())
  const [isNoteTooltipOpen, setIsNoteTooltipOpen] = useState(false)

  useEffect(() => {
    if (isSaving) setIsNoteTooltipOpen(false)
  }, [isSaving])

  const style = useMemo(() => getCellStyle(cell, manualBackground), [cell, manualBackground])
  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLTableCellElement>) => {
      if (event.button !== 0) return
      if (isSaving) return
      if (!canUseDataStatusActions) return
      if (event.target instanceof Element && event.target.closest('[data-table-interactive]')) {
        return
      }

      event.preventDefault()
      onSelect(cellKey, { append: event.ctrlKey || event.metaKey })
      onFocusTable()
    },
    [canUseDataStatusActions, cellKey, isSaving, onFocusTable, onSelect]
  )
  const handleMouseEnter = useCallback(() => {
    if (isSaving) return

    onExtendSelection(cellKey)

    if (hasNote && !isNoteOpen) {
      setIsNoteTooltipOpen(true)
    }
  }, [cellKey, hasNote, isNoteOpen, isSaving, onExtendSelection])
  const handleMouseLeave = useCallback(() => setIsNoteTooltipOpen(false), [])
  const handleContextMenu = useCallback(
    (event: React.MouseEvent<HTMLTableCellElement>) => {
      if (!canUseDataStatusActions) return
      if (isSaving) return

      event.preventDefault()
      setIsNoteTooltipOpen(false)
      onContextMenu(cellKey, { x: event.clientX, y: event.clientY })
    },
    [canUseDataStatusActions, cellKey, isSaving, onContextMenu]
  )
  const handleDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLTableCellElement>) => {
      if (!canEditValue) return
      if (isSaving) return
      if (event.target instanceof Element && event.target.closest('[data-table-interactive]')) {
        return
      }

      event.preventDefault()
      onOpenEditor(cellKey, { kind: 'current' })
    },
    [canEditValue, cellKey, isSaving, onOpenEditor]
  )
  const handleOpenPicker = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()
      if (isSaving) return
      onOpenEditor(cellKey, { kind: 'current' })
    },
    [cellKey, isSaving, onOpenEditor]
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
      ref={setTdRef}
      className={cn(styles.td, {
        [styles.constCellComments]: cell.data.comments_id,
        [styles.selectedCell]: isSelected,
        [styles.activeCell]: isActive,
        [styles.lockedCell]: isLocked,
        [styles.selectedLockedCell]: isSelected && isLocked,
        [styles.noteCell]: hasNote,
        [styles.pendingCell]: isCellChanged
      })}
      colSpan={cell.data.colspan}
      rowSpan={cell.data.rowspan}
      style={style}
      data-cell-key={cellKey}
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
        data-cell-content={cellKey}
        style={contentSize}
        title={hasNote || session ? undefined : displayValue}
        className={cn(styles.constCell, {
          [styles.nowrap]: isNumericCellValue(cell.formatted_value),
          [styles.preWrap]: cell.data.editor?.type === 'textarea'
        })}
      >
        <span style={isEditingTextLike ? { visibility: 'hidden' } : undefined}>{displayValue}</span>
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
            onNavigateByTab={onNavigateEditorByTab}
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
          disabled={isSaving}
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
          onNavigateByTab={onNavigateEditorByTab}
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
      {hasNote && isNoteTooltipOpen && !isNoteOpen && !isSaving && (
        <DataStatusNote
          value={noteValue ?? ''}
          anchorRef={tdRef}
          tableOwnerId={tableOwnerId}
          onClose={handleMouseLeave}
          onChange={handleNoteChange}
          preview
        />
      )}
    </td>
  )
}

export const TableCell = memo(TableCellComponent)
