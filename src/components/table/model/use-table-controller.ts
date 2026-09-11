'use client'

import { useCallback, useRef, useId } from 'react'

import { useTableNotes } from './notes/use-table-notes'
import { useTableKeyboard } from './use-table-keyboard'
import type { TableProps } from '../types'
import type { EditStart } from './editing/editing.types'
import { useTableChanges } from './changes/use-table-changes'
import { useTableData } from './data/use-table-data'
import { useTableEditing } from './editing/use-table-editing'
import { useTableInteractions } from './use-table-interactions'
import { useTableSave } from './save/use-table-save'
import { useTableSelection } from './selection/use-table-selection'
import { useCellChanges } from './changes/use-cell-changes'

export function useTableController({
  data,
  availableBackgroundColors = [],
  cellManagementEnabled,
  onSaveChanges
}: TableProps) {
  const ownerId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const clearSaveMessageRef = useRef<() => void>(() => {})
  const onLocalChange = useCallback(() => clearSaveMessageRef.current(), [])
  const editingOpenRef = useRef(false)
  const savingOpenRef = useRef(false)
  const {
    pendingChanges,
    pendingRef,
    updatePending,
    resetPending,
    summary: pendingSummary
  } = useTableChanges({ isBlockedRef: savingOpenRef, onLocalChange })
  const { baseData, acceptSavedData, entriesByKey, structure } = useTableData(data, {
    canAcceptIncoming: () =>
      !savingOpenRef.current &&
      !editingOpenRef.current &&
      Object.keys(pendingRef.current.values).length === 0 &&
      Object.keys(pendingRef.current.backgrounds).length === 0 &&
      Object.keys(pendingRef.current.notes).length === 0
  })
  const selection = useTableSelection(structure, {
    isEnabled: cellManagementEnabled,
    isBlockedRef: savingOpenRef
  })
  const {
    changeValue: changePendingValue,
    changeBackground,
    clearSelectedValues,
    backgroundEditableSelectedCount
  } = useCellChanges({
    entriesByKey,
    selectedCellKeys: selection.selectedCellKeys,
    cellManagementEnabled,
    isBlockedRef: savingOpenRef,
    updatePending
  })
  const editing = useTableEditing({
    onLocalChange,
    entriesByKey,
    pendingValues: pendingChanges.values,
    onPendingValueChange: changePendingValue,
    isBlockedRef: savingOpenRef
  })
  const { commitEditing, cancelEditing, startEditing } = editing
  const { selectOnly, clearSelection, stopDragging } = selection
  const {
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
  } = useTableNotes({
    savingOpenRef,
    entriesByKey,
    pendingChanges,
    updatePending,
    commitEditing,
    cellManagementEnabled
  })
  editingOpenRef.current = Boolean(editing.session)

  const canSaveDraft = Boolean(editing.session)
  const applyBackground = useCallback(
    (background: string | null) => {
      if (savingOpenRef.current) return
      commitEditing()
      changeBackground(background)
    },
    [commitEditing, changeBackground]
  )
  const focusRoot = useCallback(() => {
    if (savingOpenRef.current) return
    requestAnimationFrame(() => {
      if (!savingOpenRef.current && !editingOpenRef.current) {
        rootRef.current?.focus({ preventScroll: true })
      }
    })
  }, [])
  const commitEditorWithFocus = useCallback(() => {
    commitEditing()
    focusRoot()
  }, [commitEditing, focusRoot])
  const cancelEditorWithFocus = useCallback(() => {
    cancelEditing()
    focusRoot()
  }, [cancelEditing, focusRoot])
  const openEditor = useCallback(
    (cellKey: string, start: EditStart) => {
      if (savingOpenRef.current) return

      const didStart = startEditing(cellKey, start)

      if (didStart) {
        selectOnly(cellKey)
        closeNotes()
      }
    },
    [startEditing, selectOnly, closeNotes]
  )
  const leaveTable = useCallback(() => {
    if (savingOpenRef.current) return

    clearSelection()
    closeNotes()
  }, [clearSelection, closeNotes])
  const prepareForSave = useCallback(() => {
    commitEditing()
    closeNotes()
    stopDragging()
  }, [commitEditing, closeNotes, stopDragging])
  const tableSave = useTableSave({
    isSavingRef: savingOpenRef,
    pendingRef,
    entriesByKey,
    onSaveChanges,
    acceptSavedData,
    resetPending,
    prepareForSave
  })
  clearSaveMessageRef.current = tableSave.clearSaveMessage
  const { clearSaveMessage } = tableSave
  const handleCancelChanges = useCallback(() => {
    if (savingOpenRef.current) return

    cancelEditing()
    resetPending()
    closeNotes()
    clearSaveMessage()
  }, [cancelEditing, resetPending, clearSaveMessage, closeNotes])
  const handleRootKeyDown = useTableKeyboard({
    rootRef,
    savingOpenRef,
    selection,
    entriesByKey,
    cellManagementEnabled,
    commitEditing,
    closeNotes,
    openEditor,
    clearSelectedValues
  })

  useTableInteractions({
    ownerId,
    rootRef,
    hasEditor: Boolean(editing.session),
    onLeaveEditor: commitEditing,
    onLeaveTable: leaveTable,
    isBlockedRef: savingOpenRef
  })

  return {
    rootRef,
    selection,
    cellManagementEnabled,
    ownerId,
    tableSave,
    handleRootKeyDown,
    availableBackgroundColors,
    backgroundEditableSelectedCount,
    pendingSummary,
    canSaveDraft,
    applyBackground,
    handleCancelChanges,
    baseData,
    structure,
    pendingChanges,
    editing,
    openNoteKey,
    getNoteValue,
    openEditor,
    commitEditorWithFocus,
    cancelEditorWithFocus,
    focusRoot,
    closeNoteEditor,
    changeNote,
    openContextMenu,
    contextMenu,
    contextMenuEntry,
    openNoteEditor,
    deleteNote,
    closeContextMenu
  }
}
