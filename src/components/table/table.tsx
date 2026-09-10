'use client'

import { useCallback, useMemo, useRef, useState, useId } from 'react'

import type { CellTable, TableProps } from './types'
import { getCellCapabilities } from './lib/cell-capabilities'
import type { TableCellEntry } from './lib/table-index'
import type { KeyboardDirection } from './lib/virtual-table'
import type { EditStart } from './model/editing.types'
import { useTableChanges } from './model/use-table-changes'
import { useTableData } from './model/use-table-data'
import { useTableEditing } from './model/use-table-editing'
import { useTableInteractions } from './model/use-table-interactions'
import { useTableSave } from './model/use-table-save'
import { useTableSelection } from './model/use-table-selection'
import {
  getPendingNote,
  setPendingBackgroundChanges,
  setPendingNoteChange,
  setPendingValueChange,
  setPendingValueChanges
} from './model/pending-changes'
import { TableBody } from './ui/body/table-body'
import { TableContextMenu } from './ui/context-menu/table-context-menu'
import { TableToolbar } from './ui/toolbar/table-toolbar'
import styles from './table.module.css'

function getKeyboardDirection(key: string): KeyboardDirection | null {
  if (key === 'ArrowUp') return 'up'
  if (key === 'ArrowDown') return 'down'
  if (key === 'ArrowLeft') return 'left'
  if (key === 'ArrowRight') return 'right'
  return null
}

export function Table({
  data,
  availableBackgroundColors = [],
  cellManagementEnabled,
  onSaveChanges
}: TableProps) {
  const ownerId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const editingOpenRef = useRef(false)
  const savingOpenRef = useRef(false)
  const {
    pendingChanges,
    pendingRef,
    updatePending,
    resetPending,
    summary: pendingSummary
  } = useTableChanges()
  const {
    baseData,
    acceptSavedData,
    entries: selectionEntries,
    entriesByKey,
    structure
  } = useTableData(data, {
    canAcceptIncoming: () =>
      !savingOpenRef.current &&
      !editingOpenRef.current &&
      Object.keys(pendingRef.current.values).length === 0 &&
      Object.keys(pendingRef.current.backgrounds).length === 0 &&
      Object.keys(pendingRef.current.notes).length === 0
  })
  const selection = useTableSelection(baseData, {
    isEnabled: cellManagementEnabled,
    isBlockedRef: savingOpenRef
  })
  const [openNoteKey, setOpenNoteKey] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ cellKey: string; x: number; y: number } | null>(
    null
  )
  const changePendingValue = useCallback(
    (cellKey: string, value: CellTable['value']) => {
      if (savingOpenRef.current) return

      const entry = entriesByKey.get(cellKey)

      if (!entry || !getCellCapabilities(entry.cell).canEditValue) {
        return
      }

      updatePending((current) => setPendingValueChange(current, cellKey, entry.cell, value))
    },
    [entriesByKey, updatePending]
  )
  const editing = useTableEditing({
    entries: selectionEntries,
    pendingValues: pendingChanges.values,
    onPendingValueChange: changePendingValue,
    isBlockedRef: savingOpenRef
  })
  editingOpenRef.current = Boolean(editing.session)

  const selectedEntries = useMemo(() => {
    const result: TableCellEntry[] = []
    Array.from(selection.selectedCellKeys).forEach((key) => {
      const entry = entriesByKey.get(key)
      if (entry) result.push(entry)
    })
    return result
  }, [entriesByKey, selection.selectedCellKeys])
  const backgroundEditableSelectedCount = useMemo(
    () =>
      selectedEntries.filter(
        (entry) =>
          getCellCapabilities(entry.cell, { dataStatusActionsEnabled: cellManagementEnabled })
            .canChangeBackground
      ).length,
    [cellManagementEnabled, selectedEntries]
  )
  const canSaveDraft = Boolean(editing.session)
  const contextMenuEntry = useMemo(
    () => (contextMenu ? (entriesByKey.get(contextMenu.cellKey) ?? null) : null),
    [contextMenu, entriesByKey]
  )

  const applyBackground = useCallback(
    (background: string | null) => {
      if (savingOpenRef.current) return

      editing.commitEditing()
      updatePending((current) => {
        const editableEntries = selectedEntries.filter(
          (entry) =>
            getCellCapabilities(entry.cell, { dataStatusActionsEnabled: cellManagementEnabled })
              .canChangeBackground
        )

        return setPendingBackgroundChanges(current, editableEntries, background)
      })
    },
    [cellManagementEnabled, editing, selectedEntries, updatePending]
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
    [cellManagementEnabled, entriesByKey, updatePending]
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
    [cellManagementEnabled, entriesByKey, updatePending]
  )
  const openNoteEditor = useCallback(
    (cellKey: string) => {
      if (savingOpenRef.current) return

      editing.commitEditing()
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
    [cellManagementEnabled, editing, entriesByKey]
  )
  const closeNoteEditor = useCallback(() => {
    if (savingOpenRef.current) return
    setOpenNoteKey(null)
  }, [])
  const openContextMenu = useCallback(
    (cellKey: string, position: { x: number; y: number }) => {
      if (savingOpenRef.current) return

      const entry = entriesByKey.get(cellKey)
      if (!entry || !cellManagementEnabled) {
        setOpenNoteKey(null)
        setContextMenu(null)
        return
      }

      editing.commitEditing()
      setOpenNoteKey(null)
      setContextMenu({ cellKey, ...position })
    },
    [cellManagementEnabled, editing, entriesByKey]
  )
  const closeContextMenu = useCallback(() => {
    if (savingOpenRef.current) return
    setContextMenu(null)
  }, [])
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
      if (savingOpenRef.current) return

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
    if (savingOpenRef.current) return

    selection.clearSelection()
    setOpenNoteKey(null)
    setContextMenu(null)
  }, [selection])
  const prepareForSave = useCallback(() => {
    editing.commitEditing()
    setOpenNoteKey(null)
    setContextMenu(null)
    selection.stopDragging()
  }, [editing, selection])
  const tableSave = useTableSave({
    isSavingRef: savingOpenRef,
    pendingRef,
    entriesByKey,
    onSaveChanges,
    acceptSavedData,
    resetPending,
    prepareForSave
  })
  const handleCancelChanges = useCallback(() => {
    if (savingOpenRef.current) return

    editing.cancelEditing()
    resetPending()
    setOpenNoteKey(null)
    setContextMenu(null)
    tableSave.clearSaveMessage()
  }, [editing, resetPending, tableSave])
  const handleRootKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.target !== rootRef.current) return

      const activeKey = selection.activeCellKey
      if (!activeKey || !selection.selectedCellKeys.has(activeKey)) return

      const activeEntry = selectionEntries.find((entry) => entry.key === activeKey)
      if (!activeEntry) return
      if (!cellManagementEnabled) return
      if (savingOpenRef.current) return

      const direction = getKeyboardDirection(event.key)
      if (direction) {
        event.preventDefault()
        editing.commitEditing()
        setOpenNoteKey(null)
        setContextMenu(null)

        if (event.shiftKey) {
          selection.extendActiveRange(direction)
        } else {
          selection.moveActiveCell(direction)
        }

        return
      }

      if (event.key === 'Delete') {
        event.preventDefault()
        editing.commitEditing()
        setOpenNoteKey(null)
        setContextMenu(null)
        updatePending((current) =>
          setPendingValueChanges(
            current,
            selectedEntries.filter((entry) => getCellCapabilities(entry.cell).canEditValue),
            null
          )
        )
        return
      }

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
    [
      cellManagementEnabled,
      editing,
      openEditor,
      selectedEntries,
      selection,
      selectionEntries,
      updatePending
    ]
  )

  useTableInteractions({
    ownerId,
    rootRef,
    hasEditor: Boolean(editing.session),
    onLeaveEditor: editing.commitEditing,
    onLeaveTable: leaveTable,
    isBlockedRef: savingOpenRef
  })

  return (
    <div
      ref={rootRef}
      className={styles.tableContainer}
      data-is-selecting={selection.isDragging}
      data-data-status-actions-enabled={cellManagementEnabled}
      data-table-owner={ownerId}
      aria-busy={tableSave.isSaving}
      tabIndex={0}
      onKeyDown={handleRootKeyDown}
    >
      <div className={styles.toolbarSlot} data-value-editor-owner={ownerId}>
        <TableToolbar
          colors={availableBackgroundColors}
          dataStatusActionsEnabled={cellManagementEnabled}
          selectedCount={selection.selectedCellKeys.size}
          backgroundEditableSelectedCount={backgroundEditableSelectedCount}
          pendingSummary={pendingSummary}
          canSaveDraft={canSaveDraft}
          saveStatus={tableSave.saveStatus}
          saveMessage={tableSave.saveMessage}
          isSaving={tableSave.isSaving}
          onBackgroundChange={applyBackground}
          onSave={tableSave.save}
          onCancel={handleCancelChanges}
        />
      </div>
      {Array.isArray(baseData) && baseData.length > 0 && (
        <TableBody
          data={baseData}
          structure={structure}
          selection={selection}
          pendingChanges={pendingChanges}
          session={editing.session}
          tableOwnerId={ownerId}
          openNoteKey={openNoteKey}
          dataStatusActionsEnabled={cellManagementEnabled}
          isSaving={tableSave.isSaving}
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
          canEditNote={
            getCellCapabilities(contextMenuEntry.cell, {
              dataStatusActionsEnabled: cellManagementEnabled
            }).canEditNote
          }
          showUnavailableActions={
            getCellCapabilities(contextMenuEntry.cell, {
              dataStatusActionsEnabled: cellManagementEnabled
            }).isLocked
          }
          onAddNote={() => openNoteEditor(contextMenu.cellKey)}
          onEditNote={() => openNoteEditor(contextMenu.cellKey)}
          onDeleteNote={() => deleteNote(contextMenu.cellKey)}
          onClose={closeContextMenu}
        />
      )}
    </div>
  )
}
