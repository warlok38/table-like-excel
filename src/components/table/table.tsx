'use client'

import { useCallback, useMemo, useState } from 'react'

import type { AvailableBackgroundColor, CellTable } from '@/types'
import { isCellLocked, makeCellKey, makeCellSelectionEntries } from './helpers'
import { useTableSelection } from './hooks/use-table-selection'
import { MemoTableCell } from './table-cell'
import { TableContextMenu } from './table-context-menu'
import { TableToolbar } from './table-toolbar'
import styles from './table.module.css'

type TableProps = {
  data: CellTable[][]
  availableBackgroundColors?: AvailableBackgroundColor[]
  isEditablePage?: boolean | string
  formatCalendare?: string
  isFetching?: boolean
}

export function Table({ data, availableBackgroundColors = [] }: TableProps) {
  const selection = useTableSelection(data)
  const selectionEntries = useMemo(() => makeCellSelectionEntries(data), [data])
  const [manualBackgrounds, setManualBackgrounds] = useState<Record<string, string>>({})
  const [manualNotes, setManualNotes] = useState<Record<string, string | null>>({})
  const [openNoteKey, setOpenNoteKey] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ cellKey: string; x: number; y: number } | null>(
    null
  )

  const selectedEntries = useMemo(
    () => selectionEntries.filter((entry) => selection.selectedCellKeys.has(entry.key)),
    [selection.selectedCellKeys, selectionEntries]
  )
  const editableSelectedCount = useMemo(
    () => selectedEntries.filter((entry) => !isCellLocked(entry.cell)).length,
    [selectedEntries]
  )
  const contextMenuEntry = useMemo(
    () =>
      contextMenu
        ? (selectionEntries.find((entry) => entry.key === contextMenu.cellKey) ?? null)
        : null,
    [contextMenu, selectionEntries]
  )

  const applyBackground = useCallback(
    (background: string | null) => {
      setManualBackgrounds((currentBackgrounds) => {
        const nextBackgrounds = { ...currentBackgrounds }

        selectedEntries.forEach((entry) => {
          if (!isCellLocked(entry.cell)) {
            if (background) {
              nextBackgrounds[entry.key] = background
            } else {
              delete nextBackgrounds[entry.key]
            }
          }
        })

        return nextBackgrounds
      })
    },
    [selectedEntries]
  )
  const getNoteValue = useCallback(
    (cellKey: string, cell: CellTable) => {
      if (Object.prototype.hasOwnProperty.call(manualNotes, cellKey)) {
        return manualNotes[cellKey]
      }

      return cell.data_status?.note?.value ?? null
    },
    [manualNotes]
  )
  const changeNote = useCallback((cellKey: string, value: string) => {
    setManualNotes((currentNotes) => ({
      ...currentNotes,
      [cellKey]: value
    }))
  }, [])
  const deleteNote = useCallback((cellKey: string) => {
    setManualNotes((currentNotes) => ({
      ...currentNotes,
      [cellKey]: null
    }))
    setOpenNoteKey(null)
    setContextMenu(null)
  }, [])
  const openNoteEditor = useCallback(
    (cellKey: string) => {
      const entry = selectionEntries.find((selectionEntry) => selectionEntry.key === cellKey)

      if (!entry || isCellLocked(entry.cell)) {
        return
      }

      setManualNotes((currentNotes) => {
        if (Object.prototype.hasOwnProperty.call(currentNotes, cellKey)) {
          return currentNotes
        }

        return {
          ...currentNotes,
          [cellKey]: entry.cell.data_status?.note?.value ?? ''
        }
      })
      setOpenNoteKey(cellKey)
      setContextMenu(null)
    },
    [selectionEntries]
  )
  const closeNoteEditor = useCallback(() => setOpenNoteKey(null), [])
  const openContextMenu = useCallback((cellKey: string, position: { x: number; y: number }) => {
    setOpenNoteKey(null)
    setContextMenu({ cellKey, ...position })
  }, [])
  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  return (
    <div className={styles.tableContainer} data-is-selecting={selection.isDragging}>
      <div className={styles.toolbarSlot}>
        <TableToolbar
          colors={availableBackgroundColors}
          selectedCount={selection.selectedCellKeys.size}
          editableSelectedCount={editableSelectedCount}
          onBackgroundChange={applyBackground}
        />
      </div>
      {Array.isArray(data) && data.length > 0 && (
        <TableBody
          data={data}
          selection={selection}
          manualBackgrounds={manualBackgrounds}
          openNoteKey={openNoteKey}
          getNoteValue={getNoteValue}
          onCloseNote={closeNoteEditor}
          onNoteChange={changeNote}
          onContextMenu={openContextMenu}
        />
      )}
      {contextMenu && contextMenuEntry && (
        <TableContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          hasNote={Boolean(getNoteValue(contextMenu.cellKey, contextMenuEntry.cell)?.trim())}
          isLocked={isCellLocked(contextMenuEntry.cell)}
          onAddNote={() => openNoteEditor(contextMenu.cellKey)}
          onEditNote={() => openNoteEditor(contextMenu.cellKey)}
          onDeleteNote={() => deleteNote(contextMenu.cellKey)}
          onClose={closeContextMenu}
        />
      )}
    </div>
  )
}

function TableBody({
  data,
  selection,
  manualBackgrounds,
  openNoteKey,
  getNoteValue,
  onCloseNote,
  onNoteChange,
  onContextMenu
}: {
  data: CellTable[][]
  selection: ReturnType<typeof useTableSelection>
  manualBackgrounds: Record<string, string>
  openNoteKey: string | null
  getNoteValue: (cellKey: string, cell: CellTable) => string | null
  onCloseNote: () => void
  onNoteChange: (cellKey: string, value: string) => void
  onContextMenu: (cellKey: string, position: { x: number; y: number }) => void
}) {
  return (
    <table className={styles.table}>
      <tbody className={styles.tbody}>
        {data.map((row, rowIndex) => (
          <tr key={`row-${rowIndex + 1}`} className={styles.tr}>
            {row.map((cell, cellIndex) => {
              const cellKey = makeCellKey(cell, rowIndex, cellIndex)

              return (
                <MemoTableCell
                  key={cellKey}
                  cell={cell}
                  cellKey={cellKey}
                  rowIndex={rowIndex}
                  cellIndex={cellIndex}
                  manualBackground={manualBackgrounds[cellKey] ?? null}
                  noteValue={getNoteValue(cellKey, cell)}
                  isNoteOpen={openNoteKey === cellKey}
                  isActive={selection.activeCellKey === cellKey}
                  isSelected={selection.selectedCellKeys.has(cellKey)}
                  isLocked={isCellLocked(cell)}
                  onSelect={selection.selectCell}
                  onExtendSelection={selection.extendRangeToCell}
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
