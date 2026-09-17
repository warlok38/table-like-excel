'use client'

import { useCallback, useRef, useId } from 'react'

import { useTableNotes } from './notes/useTableNotes'
import { useTableKeyboard } from './useTableKeyboard'
import type { TableProps } from './table'
import type { EditStart } from './editing/editingSession'
import { useTableChanges } from './changes/useTableChanges'
import { useTableData } from './data/useTableData'
import { useTableEditing } from './editing/useTableEditing'
import { useTableInteractions } from './useTableInteractions'
import { useTableSave } from './save/useTableSave'
import { useTableSelection } from './selection/useTableSelection'
import { useCellChanges } from './changes/useCellChanges'
import type { AvailableBackgroundColor } from './table'
import type { TableSaveStatus } from './save/useTableSave'

export type TableHeaderActionsModel = {
  ownerId: string
  colors: AvailableBackgroundColor[]
  dataStatusActionsEnabled: boolean
  canChangeBackground: boolean
  canSave: boolean
  canCancel: boolean
  isSaving: boolean
  saveStatus: TableSaveStatus
  applyBackground: (color: string | null) => void
  save: () => Promise<void>
  cancel: () => void
}

export function useTableController({
  data,
  availableBackgroundColors = [],
  cellManagementEnabled,
  onSaveChanges
}: TableProps) {
  const ownerId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const clearSaveStatusRef = useRef<() => void>(() => {})
  const onLocalChange = useCallback(() => clearSaveStatusRef.current(), [])
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
  const {
    activeCellKey,
    selectOnly,
    clearSelection,
    stopDragging,
    moveActiveCellLinear,
    selectBoundaryCell
  } = selection
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
  const navigateEditorByTab = useCallback(
    (backward: boolean) => {
      if (savingOpenRef.current) return false

      commitEditing()
      closeNotes()
      const didMove = moveActiveCellLinear(backward ? 'backward' : 'forward')

      if (didMove) {
        focusRoot()
      } else {
        clearSelection()
      }

      return didMove
    },
    [clearSelection, closeNotes, commitEditing, focusRoot, moveActiveCellLinear]
  )
  const handleRootFocus = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      if (activeCellKey || !cellManagementEnabled || savingOpenRef.current) return

      const previous = event.relatedTarget
      const root = rootRef.current
      const enteredBackward =
        previous instanceof Node &&
        root !== null &&
        Boolean(root.compareDocumentPosition(previous) & Node.DOCUMENT_POSITION_FOLLOWING)

      selectBoundaryCell(enteredBackward ? 'backward' : 'forward')
    },
    [activeCellKey, cellManagementEnabled, selectBoundaryCell]
  )
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
  clearSaveStatusRef.current = tableSave.clearSaveStatus
  const { clearSaveStatus } = tableSave
  const handleCancelChanges = useCallback(() => {
    if (savingOpenRef.current) return

    cancelEditing()
    resetPending()
    closeNotes()
    clearSaveStatus()
  }, [cancelEditing, resetPending, clearSaveStatus, closeNotes])
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

  const hasPendingActions = pendingSummary.operations > 0 || canSaveDraft
  const headerActions: TableHeaderActionsModel = {
    ownerId,
    colors: availableBackgroundColors,
    dataStatusActionsEnabled: cellManagementEnabled,
    canChangeBackground: backgroundEditableSelectedCount > 0 && !tableSave.isSaving,
    canSave: hasPendingActions && !tableSave.isSaving,
    canCancel: hasPendingActions && !tableSave.isSaving,
    isSaving: tableSave.isSaving,
    saveStatus: tableSave.saveStatus,
    applyBackground,
    save: tableSave.save,
    cancel: handleCancelChanges
  }

  return {
    headerActions,
    rootRef,
    selection,
    cellManagementEnabled,
    ownerId,
    tableSave,
    handleRootKeyDown,
    handleRootFocus,
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
    navigateEditorByTab,
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

export type TableController = ReturnType<typeof useTableController>
