'use client'

import { useCallback, useMemo, useRef, useState, useId } from 'react'

import type { AvailableBackgroundColor, CellTable } from '@/types'
import { getCellCapabilities, makeCellSelectionEntries } from './helpers'
import type { EditStart } from './editing/types'
import { useTableEditing } from './hooks/use-table-editing'
import { useTableInteractions } from './hooks/use-table-interactions'
import { useTableSelection } from './hooks/use-table-selection'
import { TableBody } from './table-body'
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
  const ownerId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const selection = useTableSelection(data)
  const selectionEntries = useMemo(() => makeCellSelectionEntries(data), [data])
  const editing = useTableEditing(selectionEntries)
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
  const backgroundEditableSelectedCount = useMemo(
    () =>
      selectedEntries.filter((entry) => getCellCapabilities(entry.cell).canChangeBackground).length,
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
      editing.commitEditing()
      setManualBackgrounds((currentBackgrounds) => {
        const nextBackgrounds = { ...currentBackgrounds }

        selectedEntries.forEach((entry) => {
          if (getCellCapabilities(entry.cell).canChangeBackground) {
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
    [editing, selectedEntries]
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
  const changeNote = useCallback(
    (cellKey: string, value: string) => {
      const entry = selectionEntries.find((item) => item.key === cellKey)

      if (!entry || !getCellCapabilities(entry.cell).canEditNote) return

      setManualNotes((currentNotes) => ({
        ...currentNotes,
        [cellKey]: value
      }))
    },
    [selectionEntries]
  )
  const deleteNote = useCallback(
    (cellKey: string) => {
      const entry = selectionEntries.find((item) => item.key === cellKey)

      if (!entry || !getCellCapabilities(entry.cell).canEditNote) return

      setManualNotes((currentNotes) => ({
        ...currentNotes,
        [cellKey]: null
      }))
      setOpenNoteKey(null)
      setContextMenu(null)
    },
    [selectionEntries]
  )
  const openNoteEditor = useCallback(
    (cellKey: string) => {
      editing.commitEditing()
      const entry = selectionEntries.find((selectionEntry) => selectionEntry.key === cellKey)

      if (!entry || !getCellCapabilities(entry.cell).canEditNote) {
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
    [editing, selectionEntries]
  )
  const closeNoteEditor = useCallback(() => setOpenNoteKey(null), [])
  const openContextMenu = useCallback(
    (cellKey: string, position: { x: number; y: number }) => {
      editing.commitEditing()
      setOpenNoteKey(null)
      setContextMenu({ cellKey, ...position })
    },
    [editing]
  )
  const closeContextMenu = useCallback(() => setContextMenu(null), [])
  const focusRoot = useCallback(() => {
    requestAnimationFrame(() => rootRef.current?.focus({ preventScroll: true }))
  }, [])
  const commitEditorWithFocus = useCallback(() => {
    editing.commitEditing()
    focusRoot()
  }, [editing, focusRoot])
  const cancelEditorWithFocus = useCallback(() => {
    editing.cancelEditing()
    focusRoot()
  }, [editing, focusRoot])
  const openEditor = useCallback(
    (cellKey: string, start: EditStart) => {
      const didStart = editing.startEditing(cellKey, start)

      if (didStart) {
        selection.selectOnly(cellKey)
        setOpenNoteKey(null)
        setContextMenu(null)
      }
    },
    [editing, selection]
  )
  const leaveTable = useCallback(() => {
    selection.clearSelection()
    setOpenNoteKey(null)
    setContextMenu(null)
  }, [selection])
  const handleRootKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.target !== rootRef.current) return

      const activeKey = selection.activeCellKey
      if (!activeKey || !selection.selectedCellKeys.has(activeKey)) return

      const activeEntry = selectionEntries.find((entry) => entry.key === activeKey)
      if (!activeEntry) return

      if (event.key === 'Enter') {
        event.preventDefault()
        openEditor(activeKey, { kind: 'current' })
        return
      }

      if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) {
        return
      }

      const editor = activeEntry.cell.data.editor
      if (
        !editor ||
        editor.type === 'readonly' ||
        editor.type === 'select' ||
        editor.type === 'date'
      ) {
        return
      }

      event.preventDefault()
      openEditor(activeKey, { kind: 'replace', text: event.key })
    },
    [openEditor, selection.activeCellKey, selection.selectedCellKeys, selectionEntries]
  )

  useTableInteractions({
    ownerId,
    rootRef,
    hasEditor: Boolean(editing.session),
    onLeaveEditor: editing.commitEditing,
    onLeaveTable: leaveTable
  })

  return (
    <div
      ref={rootRef}
      className={styles.tableContainer}
      data-is-selecting={selection.isDragging}
      data-table-owner={ownerId}
      tabIndex={0}
      onKeyDown={handleRootKeyDown}
    >
      <div className={styles.toolbarSlot}>
        <TableToolbar
          colors={availableBackgroundColors}
          selectedCount={selection.selectedCellKeys.size}
          backgroundEditableSelectedCount={backgroundEditableSelectedCount}
          onBackgroundChange={applyBackground}
        />
      </div>
      {Array.isArray(data) && data.length > 0 && (
        <TableBody
          data={data}
          selection={selection}
          manualBackgrounds={manualBackgrounds}
          pendingValues={editing.pendingValues}
          session={editing.session}
          tableOwnerId={ownerId}
          openNoteKey={openNoteKey}
          getNoteValue={getNoteValue}
          onOpenEditor={openEditor}
          onDraftChange={editing.updateDraft}
          onChooseValue={editing.chooseValue}
          onCommitEditor={commitEditorWithFocus}
          onCancelEditor={cancelEditorWithFocus}
          onFocusTable={focusRoot}
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
          canEditNote={getCellCapabilities(contextMenuEntry.cell).canEditNote}
          onAddNote={() => openNoteEditor(contextMenu.cellKey)}
          onEditNote={() => openNoteEditor(contextMenu.cellKey)}
          onDeleteNote={() => deleteNote(contextMenu.cellKey)}
          onClose={closeContextMenu}
        />
      )}
    </div>
  )
}
