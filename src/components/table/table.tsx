'use client'

import { useCallback, useMemo, useRef, useState, useId } from 'react'

import type { AvailableBackgroundColor, CellTable } from '@/types'
import { getCellCapabilities, makeCellSelectionEntries } from './helpers'
import type { TableSaveChangeset } from './data-adapter/types'
import type { EditStart } from './editing/types'
import { useTableEditing } from './hooks/use-table-editing'
import { useTableInteractions } from './hooks/use-table-interactions'
import { useTableSelection } from './hooks/use-table-selection'
import {
  emptyPendingChanges,
  getPendingNote,
  hasPendingChanges,
  setPendingBackgroundChange,
  setPendingNoteChange,
  setPendingValueChange,
  summarizePendingChanges
} from './pending/pending-changes'
import type { PendingChanges } from './pending/types'
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
  onSaveChanges: (changeset: TableSaveChangeset) => Promise<CellTable[][]>
}

function toSaveChangeset(changes: PendingChanges): TableSaveChangeset {
  return {
    values: Object.entries(changes.values).map(([cellKey, value]) => ({ cellKey, value })),
    backgrounds: Object.entries(changes.backgrounds).map(([cellKey, background]) => ({
      cellKey,
      background
    })),
    notes: Object.entries(changes.notes).map(([cellKey, note]) => ({ cellKey, note }))
  }
}

export function Table({ data, availableBackgroundColors = [], onSaveChanges }: TableProps) {
  const ownerId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const selection = useTableSelection(data)
  const selectionEntries = useMemo(() => makeCellSelectionEntries(data), [data])
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>(emptyPendingChanges)
  const pendingChangesRef = useRef(pendingChanges)
  const [openNoteKey, setOpenNoteKey] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ cellKey: string; x: number; y: number } | null>(
    null
  )
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'failure'>('idle')
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const updatePendingChanges = useCallback(
    (updater: (current: PendingChanges) => PendingChanges) => {
      const next = updater(pendingChangesRef.current)
      pendingChangesRef.current = next
      setPendingChanges(next)
      setSaveStatus('idle')
      setSaveMessage(null)
    },
    []
  )
  const changePendingValue = useCallback(
    (cellKey: string, value: CellTable['value']) => {
      const entry = selectionEntries.find((item) => item.key === cellKey)

      if (!entry || !getCellCapabilities(entry.cell).canEditValue) return

      updatePendingChanges((current) => setPendingValueChange(current, cellKey, entry.cell, value))
    },
    [selectionEntries, updatePendingChanges]
  )
  const editing = useTableEditing({
    entries: selectionEntries,
    pendingValues: pendingChanges.values,
    onPendingValueChange: changePendingValue
  })

  const selectedEntries = useMemo(
    () => selectionEntries.filter((entry) => selection.selectedCellKeys.has(entry.key)),
    [selection.selectedCellKeys, selectionEntries]
  )
  const backgroundEditableSelectedCount = useMemo(
    () =>
      selectedEntries.filter((entry) => getCellCapabilities(entry.cell).canChangeBackground).length,
    [selectedEntries]
  )
  const pendingSummary = useMemo(() => summarizePendingChanges(pendingChanges), [pendingChanges])
  const canSaveDraft = Boolean(editing.session)
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
      updatePendingChanges((current) => {
        let nextChanges = current
        selectedEntries.forEach((entry) => {
          if (getCellCapabilities(entry.cell).canChangeBackground) {
            nextChanges = setPendingBackgroundChange(nextChanges, entry.key, entry.cell, background)
          }
        })

        return nextChanges
      })
    },
    [editing, selectedEntries, updatePendingChanges]
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
      const entry = selectionEntries.find((item) => item.key === cellKey)

      if (!entry || !getCellCapabilities(entry.cell).canEditNote) return

      updatePendingChanges((current) => setPendingNoteChange(current, cellKey, entry.cell, value))
    },
    [selectionEntries, updatePendingChanges]
  )
  const deleteNote = useCallback(
    (cellKey: string) => {
      const entry = selectionEntries.find((item) => item.key === cellKey)

      if (!entry || !getCellCapabilities(entry.cell).canEditNote) return

      updatePendingChanges((current) => setPendingNoteChange(current, cellKey, entry.cell, null))
      setOpenNoteKey(null)
      setContextMenu(null)
    },
    [selectionEntries, updatePendingChanges]
  )
  const openNoteEditor = useCallback(
    (cellKey: string) => {
      editing.commitEditing()
      const entry = selectionEntries.find((selectionEntry) => selectionEntry.key === cellKey)

      if (!entry || !getCellCapabilities(entry.cell).canEditNote) {
        return
      }

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
  const handleSave = useCallback(async () => {
    if (saveStatus === 'saving') return

    editing.commitEditing()
    setOpenNoteKey(null)
    setContextMenu(null)

    const changes = pendingChangesRef.current
    if (!hasPendingChanges(changes)) return

    setSaveStatus('saving')
    setSaveMessage('Сохраняем изменения')

    try {
      await onSaveChanges(toSaveChangeset(changes))
      pendingChangesRef.current = emptyPendingChanges
      setPendingChanges(emptyPendingChanges)
      setSaveStatus('success')
      setSaveMessage('Изменения сохранены')
    } catch (error) {
      setSaveStatus('failure')
      setSaveMessage(error instanceof Error ? error.message : 'Не удалось сохранить изменения')
    }
  }, [editing, onSaveChanges, saveStatus])
  const handleCancelChanges = useCallback(() => {
    editing.cancelEditing()
    pendingChangesRef.current = emptyPendingChanges
    setPendingChanges(emptyPendingChanges)
    setOpenNoteKey(null)
    setContextMenu(null)
    setSaveStatus('idle')
    setSaveMessage(null)
  }, [editing])
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
      <div className={styles.toolbarSlot} data-value-editor-owner={ownerId}>
        <TableToolbar
          colors={availableBackgroundColors}
          selectedCount={selection.selectedCellKeys.size}
          backgroundEditableSelectedCount={backgroundEditableSelectedCount}
          pendingSummary={pendingSummary}
          canSaveDraft={canSaveDraft}
          saveStatus={saveStatus}
          saveMessage={saveMessage}
          onBackgroundChange={applyBackground}
          onSave={handleSave}
          onCancel={handleCancelChanges}
        />
      </div>
      {Array.isArray(data) && data.length > 0 && (
        <TableBody
          data={data}
          selection={selection}
          pendingChanges={pendingChanges}
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
