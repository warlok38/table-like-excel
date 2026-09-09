'use client'

import type { CellTable } from '@/types'
import { formatPendingValue, getEffectiveValue } from './editing/value-conversion'
import type { EditingSession, PendingValues } from './editing/types'
import { formatCellValue, getCellCapabilities, makeCellKey } from './helpers'
import type { TableSelectionState } from './hooks/use-table-selection'
import { MemoTableCell } from './table-cell'
import styles from './table.module.css'

type TableBodyProps = {
  data: CellTable[][]
  selection: TableSelectionState
  manualBackgrounds: Record<string, string>
  pendingValues: PendingValues
  session: EditingSession | null
  tableOwnerId: string
  openNoteKey: string | null
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
  selection,
  manualBackgrounds,
  pendingValues,
  session,
  tableOwnerId,
  openNoteKey,
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
  return (
    <table className={styles.table}>
      <tbody className={styles.tbody}>
        {data.map((row, rowIndex) => (
          <tr key={`row-${rowIndex + 1}`} className={styles.tr}>
            {row.map((cell, cellIndex) => {
              const cellKey = makeCellKey(cell, rowIndex, cellIndex)
              const capabilities = getCellCapabilities(cell)
              const hasPending = Object.prototype.hasOwnProperty.call(pendingValues, cellKey)
              const value = getEffectiveValue(cellKey, cell, pendingValues)
              let displayValue = formatCellValue(cell.formatted_value)

              if (hasPending && cell.data.editor && cell.data.editor.type !== 'readonly') {
                displayValue = formatPendingValue(value, cell.data.editor)
              } else if (hasPending) {
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
                  manualBackground={manualBackgrounds[cellKey] ?? null}
                  noteValue={getNoteValue(cellKey, cell)}
                  isNoteOpen={openNoteKey === cellKey}
                  isActive={selection.activeCellKey === cellKey}
                  isSelected={selection.selectedCellKeys.has(cellKey)}
                  isLocked={capabilities.isLocked}
                  isValueChanged={hasPending}
                  canEditValue={capabilities.canEditValue}
                  canEditNote={capabilities.canEditNote}
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
  )
}
