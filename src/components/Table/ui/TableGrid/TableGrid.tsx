'use client'

import { useCallback, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import cn from 'classnames'

import { getTableCellKey } from '../../lib'
import {
  formatPendingValue,
  getCellCapabilities,
  getEffectiveValue,
  getPendingBackground,
  isBackgroundPending,
  isNotePending,
  isValuePending,
  type CellTable,
  type EditingSession,
  type PendingChanges,
  type TableSelectionState,
  type TableStructure
} from '../../model'
import { SelectionOutline } from '../SelectionOutline/SelectionOutline'
import { hasOwnPending } from '../../model/changes/pendingChanges'
import { useSelectionGeometry } from '../SelectionOutline/useSelectionGeometry'
import { TableCell } from '../TableCell/TableCell'
import styles from './TableGrid.module.css'
import type { TableCellContent } from './tableColumnLayout'
import { isRowRendered, VIRTUALIZATION_ROW_THRESHOLD, type VirtualRowWindow } from './tableLayout'
import { useTableDragAutoScroll } from './useTableDragAutoScroll'
import { useTableLayout } from './useTableLayout'
import { useTableVirtualRows } from './useTableVirtualRows'

const cellNumberFormat = new Intl.NumberFormat('ru-RU')

function formatCellValue(value: CellTable['formatted_value']): string {
  if (value === null) return ''
  if (typeof value === 'number') return cellNumberFormat.format(value)
  return value
}

function getDisplayValue(
  cell: CellTable,
  cellKey: string,
  values: PendingChanges['values']
): string {
  if (!hasOwnPending(values, cellKey)) return formatCellValue(cell.formatted_value)
  const value = getEffectiveValue(cellKey, cell, values)
  return cell.data.editor && cell.data.editor.type !== 'readonly'
    ? formatPendingValue(value, cell.data.editor)
    : String(value ?? '')
}

type TableGridProps = {
  data: CellTable[][]
  structure: TableStructure
  selection: TableSelectionState
  pendingChanges: PendingChanges
  session: EditingSession | null
  tableOwnerId: string
  openNoteKey: string | null
  dataStatusActionsEnabled: boolean
  isSaving: boolean
  getNoteValue: (cellKey: string, cell: CellTable) => string | null
  onOpenEditor: (
    cellKey: string,
    start: { kind: 'current' } | { kind: 'replace'; text: string }
  ) => void
  onDraftChange: (draft: string) => void
  onChooseValue: (value: string | number | null) => void
  onCommitEditor: () => void
  onCancelEditor: () => void
  onNavigateEditorByTab: (backward: boolean) => boolean
  onFocusTable: () => void
  onCloseNote: () => void
  onNoteChange: (cellKey: string, value: string) => void
  onContextMenu: (cellKey: string, position: { x: number; y: number }) => void
}

export function TableGrid({
  data,
  structure,
  selection,
  pendingChanges,
  session,
  tableOwnerId,
  openNoteKey,
  dataStatusActionsEnabled,
  isSaving,
  getNoteValue,
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
}: TableGridProps) {
  const tableRef = useRef<HTMLTableElement>(null)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const cellContents = useMemo(() => {
    const contents = new Map<string, TableCellContent>()
    data.forEach((row, rowIndex) => {
      row.forEach((cell, cellIndex) => {
        const key = getTableCellKey(cell, rowIndex, cellIndex)
        contents.set(key, {
          text: getDisplayValue(cell, key, pendingChanges.values),
          preserveLines: cell.data.editor?.type === 'textarea'
        })
      })
    })
    return contents
  }, [data, pendingChanges.values])
  const { model, snapshot, isMeasuring, registerRowRef, getScrollTop } = useTableLayout(
    tableRef,
    surfaceRef,
    viewportRef,
    structure,
    cellContents
  )
  const hasFixedColumns = snapshot !== null
  const hasVirtualViewport = data.length >= VIRTUALIZATION_ROW_THRESHOLD && hasFixedColumns
  const virtualizationEnabled = hasVirtualViewport && !isMeasuring
  const handleBeforeWindowChange = useCallback(
    (nextWindow: VirtualRowWindow) => {
      if (session) {
        const editorRow = snapshot?.rowByCellKey.get(session.cellKey)
        if (editorRow !== undefined && !isRowRendered(nextWindow, editorRow)) {
          onCommitEditor()
        }
      }

      if (openNoteKey) {
        const noteRow = snapshot?.rowByCellKey.get(openNoteKey)
        if (noteRow !== undefined && !isRowRendered(nextWindow, noteRow)) {
          onCloseNote()
        }
      }
    },
    [onCloseNote, onCommitEditor, openNoteKey, session, snapshot]
  )
  const virtualWindow = useTableVirtualRows({
    viewportRef,
    snapshot,
    enabled: virtualizationEnabled,
    getScrollTop,
    activeCellKey: selection.activeCellKey,
    onBeforeWindowChange: handleBeforeWindowChange
  })
  useLayoutEffect(() => {
    const activeCellKey = selection.activeCellKey
    if (!activeCellKey) return

    let frame: number | null = null
    let attempts = 0

    const revealActiveCell = () => {
      const table = tableRef.current
      const cell = Array.from(
        table?.querySelectorAll<HTMLTableCellElement>('[data-cell-key]') ?? []
      ).find((candidate) => candidate.dataset.cellKey === activeCellKey)

      if (cell) {
        cell.scrollIntoView({ block: 'nearest', inline: 'nearest' })
        return
      }

      attempts += 1
      if (attempts < 3) {
        frame = requestAnimationFrame(revealActiveCell)
      }
    }

    frame = requestAnimationFrame(revealActiveCell)
    return () => {
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [selection.activeCellKey])
  useTableDragAutoScroll({
    viewportRef,
    isDragging: selection.isDragging,
    onExtendSelection: selection.extendRangeToCell
  })
  const isVirtualized = virtualizationEnabled && virtualWindow !== null
  const selectionGeometry = useSelectionGeometry(
    tableRef,
    structure.key,
    snapshot?.cellRects ?? null
  )

  const renderRow = (rowIndex: number) => {
    const row = data[rowIndex]
    return (
      <tr
        key={`row-${rowIndex + 1}`}
        ref={registerRowRef(rowIndex)}
        className={styles.tr}
        data-table-row-index={rowIndex}
      >
        {row.map((cell, cellIndex) => {
          const cellKey = getTableCellKey(cell, rowIndex, cellIndex)
          const capabilities = getCellCapabilities(cell, { dataStatusActionsEnabled })
          const hasPendingValue = isValuePending(pendingChanges, cellKey)
          const hasPendingBackground = isBackgroundPending(pendingChanges, cellKey)
          const hasPendingNote = isNotePending(pendingChanges, cellKey)
          const pendingBackground = getPendingBackground(pendingChanges, cellKey)
          const value = getEffectiveValue(cellKey, cell, pendingChanges.values)
          const displayValue = cellContents.get(cellKey)!.text

          return (
            <TableCell
              key={cellKey}
              cell={cell}
              cellKey={cellKey}
              rowIndex={rowIndex}
              cellIndex={cellIndex}
              displayValue={displayValue}
              currentValue={value}
              manualBackground={hasPendingBackground ? (pendingBackground ?? null) : undefined}
              noteValue={getNoteValue(cellKey, cell)}
              isNoteOpen={openNoteKey === cellKey}
              isActive={selection.activeCellKey === cellKey}
              isSelected={selection.selectedCellKeys.has(cellKey)}
              isLocked={capabilities.isLocked}
              registerCellRef={selectionGeometry.registerCellRef}
              isValueChanged={hasPendingValue}
              isNoteChanged={hasPendingNote}
              isCellChanged={hasPendingValue || hasPendingBackground || hasPendingNote}
              canEditValue={capabilities.canEditValue}
              canEditNote={capabilities.canEditNote}
              canUseDataStatusActions={dataStatusActionsEnabled}
              isSaving={isSaving}
              session={session?.cellKey === cellKey ? session : null}
              tableOwnerId={tableOwnerId}
              onSelect={selection.selectCell}
              onExtendSelection={selection.extendRangeToCell}
              onOpenEditor={onOpenEditor}
              onDraftChange={onDraftChange}
              onChooseValue={onChooseValue}
              onCommitEditor={onCommitEditor}
              onCancelEditor={onCancelEditor}
              onNavigateEditorByTab={onNavigateEditorByTab}
              onFocusTable={onFocusTable}
              onCloseNote={onCloseNote}
              onNoteChange={onNoteChange}
              onContextMenu={onContextMenu}
            />
          )
        })}
      </tr>
    )
  }

  const renderRows = () => {
    if (!isVirtualized) return data.map((_, rowIndex) => renderRow(rowIndex))

    const rows: ReactNode[] = []
    for (let rowIndex = 0; rowIndex <= virtualWindow.pinnedRowEnd; rowIndex += 1) {
      rows.push(renderRow(rowIndex))
    }

    if (virtualWindow.paddingTop > 0) {
      rows.push(
        <tr key="virtual-spacer-top" className={styles.spacerRow} aria-hidden="true">
          <td
            className={styles.spacerCell}
            colSpan={snapshot.visualColumnCount}
            style={{ height: virtualWindow.paddingTop }}
          />
        </tr>
      )
    }

    for (let rowIndex = virtualWindow.start; rowIndex <= virtualWindow.end; rowIndex += 1) {
      rows.push(renderRow(rowIndex))
    }

    if (virtualWindow.paddingBottom > 0) {
      rows.push(
        <tr key="virtual-spacer-bottom" className={styles.spacerRow} aria-hidden="true">
          <td
            className={styles.spacerCell}
            colSpan={snapshot.visualColumnCount}
            style={{ height: virtualWindow.paddingBottom }}
          />
        </tr>
      )
    }

    return rows
  }

  return (
    <div
      ref={viewportRef}
      className={cn(styles.tableViewport, { [styles.virtualViewport]: hasVirtualViewport })}
      data-virtualized={isVirtualized || undefined}
    >
      <div ref={surfaceRef} className={styles.tableSurface}>
        <table
          ref={tableRef}
          className={cn(styles.table, { [styles.virtualTable]: hasFixedColumns })}
          style={hasFixedColumns ? { width: snapshot.totalWidth } : undefined}
        >
          {snapshot && (
            <colgroup>
              {snapshot.columnWidths.map((width, columnIndex) => (
                <col key={columnIndex} style={{ width }} />
              ))}
            </colgroup>
          )}
          <tbody className={styles.tbody}>
            {renderRows()}
            {isMeasuring && (
              <tr className={styles.columnProbeRow} aria-hidden="true">
                {Array.from({ length: model.visualColumnCount }, (_, columnIndex) => (
                  <td
                    key={columnIndex}
                    className={styles.columnProbeCell}
                    data-column-probe-cell={columnIndex}
                  />
                ))}
              </tr>
            )}
          </tbody>
        </table>
        <SelectionOutline
          rectsRef={selectionGeometry.rectsRef}
          geometryVersion={selectionGeometry.version}
          selectedCellKeys={selection.selectedCellKeys}
        />
      </div>
    </div>
  )
}
