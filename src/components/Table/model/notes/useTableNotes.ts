import { useCallback, useMemo, useState, type MutableRefObject } from 'react'
import type { CellTable } from '../table'
import type { TableCellEntry } from '../data/tableIndex'
import type { PendingChanges } from '../changes/pendingChanges'
import type { useTableChanges } from '../changes/useTableChanges'
import { getPendingNote, setPendingNoteChange } from '../changes/pendingChanges'
import { getCellCapabilities } from '../cellCapabilities'
type Options = {
  savingOpenRef: MutableRefObject<boolean>
  entriesByKey: Map<string, TableCellEntry>
  pendingChanges: PendingChanges
  updatePending: ReturnType<typeof useTableChanges>['updatePending']
  commitEditing: () => void
  cellManagementEnabled: boolean
}
export function useTableNotes({
  savingOpenRef,
  entriesByKey,
  pendingChanges,
  updatePending,
  commitEditing,
  cellManagementEnabled
}: Options) {
  const [openNoteKey, setOpenNoteKey] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ cellKey: string; x: number; y: number } | null>(
    null
  )
  const contextMenuEntry = useMemo(
    () => (contextMenu ? (entriesByKey.get(contextMenu.cellKey) ?? null) : null),
    [contextMenu, entriesByKey]
  )

  const getNoteValue = useCallback(
    (cellKey: string, cell: CellTable) => {
      const pendingNote = getPendingNote(pendingChanges, cellKey)
      if (pendingNote !== undefined) {
        return pendingNote
      }

      return cell.data_status?.note?.value ?? null
    },
    [pendingChanges]
  )
  const changeNote = useCallback(
    (cellKey: string, value: string) => {
      if (savingOpenRef.current) return

      const entry = entriesByKey.get(cellKey)

      if (
        !entry ||
        !getCellCapabilities(entry.cell, { dataStatusActionsEnabled: cellManagementEnabled })
          .canEditNote
      ) {
        return
      }

      updatePending((current) => setPendingNoteChange(current, cellKey, entry.cell, value))
    },
    [savingOpenRef, cellManagementEnabled, entriesByKey, updatePending]
  )
  const deleteNote = useCallback(
    (cellKey: string) => {
      if (savingOpenRef.current) return

      const entry = entriesByKey.get(cellKey)

      if (
        !entry ||
        !getCellCapabilities(entry.cell, { dataStatusActionsEnabled: cellManagementEnabled })
          .canEditNote
      ) {
        return
      }

      updatePending((current) => setPendingNoteChange(current, cellKey, entry.cell, null))
      setOpenNoteKey(null)
      setContextMenu(null)
    },
    [savingOpenRef, cellManagementEnabled, entriesByKey, updatePending]
  )
  const openNoteEditor = useCallback(
    (cellKey: string) => {
      if (savingOpenRef.current) return

      commitEditing()
      const entry = entriesByKey.get(cellKey)

      if (
        !entry ||
        !getCellCapabilities(entry.cell, { dataStatusActionsEnabled: cellManagementEnabled })
          .canEditNote
      ) {
        return
      }

      setOpenNoteKey(cellKey)
      setContextMenu(null)
    },
    [savingOpenRef, cellManagementEnabled, commitEditing, entriesByKey]
  )
  const closeNoteEditor = useCallback(() => {
    if (savingOpenRef.current) return
    setOpenNoteKey(null)
  }, [savingOpenRef])
  const openContextMenu = useCallback(
    (cellKey: string, position: { x: number; y: number }) => {
      if (savingOpenRef.current) return

      const entry = entriesByKey.get(cellKey)
      if (!entry || !cellManagementEnabled) {
        setOpenNoteKey(null)
        setContextMenu(null)
        return
      }

      commitEditing()
      setOpenNoteKey(null)
      setContextMenu({ cellKey, ...position })
    },
    [savingOpenRef, cellManagementEnabled, commitEditing, entriesByKey]
  )
  const closeContextMenu = useCallback(() => {
    if (savingOpenRef.current) return
    setContextMenu(null)
  }, [savingOpenRef])

  const closeNotes = useCallback(() => {
    if (savingOpenRef.current) return
    setOpenNoteKey(null)
    setContextMenu(null)
  }, [savingOpenRef])
  return {
    openNoteKey,
    contextMenu,
    contextMenuEntry,
    getNoteValue,
    changeNote,
    deleteNote,
    openNoteEditor,
    closeNoteEditor,
    openContextMenu,
    closeContextMenu,
    closeNotes
  }
}
