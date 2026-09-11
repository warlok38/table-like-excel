'use client'

import { getCellCapabilities, useTableController, type TableProps } from './model'
import { TableContextMenu, TableGrid, TableToolbar } from './ui'
import styles from './Table.module.css'

export function Table(props: TableProps) {
  const {
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
  } = useTableController(props)

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
        <TableGrid
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
