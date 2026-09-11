'use client'

import { useRef } from 'react'

import type { TableStructure } from '../../model/data/table-structure'
import type { CellTable } from '../../types'
import { formatPendingValue, getEffectiveValue } from '../../model/editing/value-conversion'
import type { EditingSession } from '../../model/editing/editing.types'
const cellNumberFormat = new Intl.NumberFormat('ru-RU')
function formatCellValue(value: CellTable['formatted_value']): string {
  if (value === null) return ''
  if (typeof value === 'number') return cellNumberFormat.format(value)
  return value
}
import { getCellCapabilities } from '../../model/cell-capabilities'
import { makeCellKey } from '../../lib/cell-key'
import type { TableSelectionState } from '../../model/selection/use-table-selection'
import {
  getPendingBackground,
  isBackgroundPending,
  isNotePending,
  isValuePending
} from '../../model/changes/pending-changes'
import type { PendingChanges } from '../../model/changes/pending.types'
import { MemoTableCell } from '../cell/table-cell'
import styles from './table-body.module.css'
import { useCellLayout } from './use-cell-layout'
import { SelectionOutline } from '../selection/selection-outline'
import { useSelectionGeometry } from '../selection/use-selection-geometry'

type TableBodyProps = {
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
  onFocusTable: () => void
  onCloseNote: () => void
  onNoteChange: (cellKey: string, value: string) => void
  onContextMenu: (cellKey: string, position: { x: number; y: number }) => void
}

export function TableBody({
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
  onFocusTable,
  onCloseNote,
  onNoteChange,
  onContextMenu
}: TableBodyProps) {
  const tableRef = useRef<HTMLTableElement>(null)
  const cellSizes = useCellLayout(tableRef, structure.key)
  const selectionGeometry = useSelectionGeometry(tableRef, structure.key)

  return (
    <div className={styles.tableSurface}>
      <table ref={tableRef} className={styles.table}>
        <tbody className={styles.tbody}>
          {data.map((row, rowIndex) => (
            <tr key={`row-${rowIndex + 1}`} className={styles.tr}>
              {row.map((cell, cellIndex) => {
                const cellKey = makeCellKey(cell, rowIndex, cellIndex)
                const capabilities = getCellCapabilities(cell, { dataStatusActionsEnabled })
                const hasPendingValue = isValuePending(pendingChanges, cellKey)
                const hasPendingBackground = isBackgroundPending(pendingChanges, cellKey)
                const hasPendingNote = isNotePending(pendingChanges, cellKey)
                const pendingBackground = getPendingBackground(pendingChanges, cellKey)
                const value = getEffectiveValue(cellKey, cell, pendingChanges.values)
                let displayValue = formatCellValue(cell.formatted_value)

                if (hasPendingValue && cell.data.editor && cell.data.editor.type !== 'readonly') {
                  displayValue = formatPendingValue(value, cell.data.editor)
                } else if (hasPendingValue) {
                  displayValue = String(value ?? '')
                }

                return (
                  <MemoTableCell
                    key={cellKey}
                    cell={cell}
                    cellKey={cellKey}
                    rowIndex={rowIndex}
                    cellIndex={cellIndex}
                    displayValue={displayValue}
                    currentValue={value}
                    manualBackground={
                      hasPendingBackground ? (pendingBackground ?? null) : undefined
                    }
                    noteValue={getNoteValue(cellKey, cell)}
                    isNoteOpen={openNoteKey === cellKey}
                    isActive={selection.activeCellKey === cellKey}
                    isSelected={selection.selectedCellKeys.has(cellKey)}
                    isLocked={capabilities.isLocked}
                    contentSize={cellSizes?.get(cellKey)}
                    registerCellRef={selectionGeometry.registerCellRef}
                    isValueChanged={hasPendingValue}
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
                    onFocusTable={onFocusTable}
                    onCloseNote={onCloseNote}
                    onNoteChange={onNoteChange}
                    onContextMenu={onContextMenu}
                  />
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <SelectionOutline
        rectsRef={selectionGeometry.rectsRef}
        geometryVersion={selectionGeometry.version}
        selectedCellKeys={selection.selectedCellKeys}
      />
    </div>
  )
}
