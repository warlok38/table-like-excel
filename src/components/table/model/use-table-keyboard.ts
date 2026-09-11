import { useCallback, type RefObject, type MutableRefObject } from 'react'
import type { KeyboardDirection } from './selection/virtual-table'
import type { TableSelectionState } from './selection/use-table-selection'
import type { TableCellEntry } from './data/table-index'
import type { EditStart } from './editing/editing.types'
type Options = {
  rootRef: RefObject<HTMLDivElement>
  savingOpenRef: MutableRefObject<boolean>
  selection: TableSelectionState
  entriesByKey: Map<string, TableCellEntry>
  cellManagementEnabled: boolean
  commitEditing: () => void
  closeNotes: () => void
  openEditor: (key: string, start: EditStart) => void
  clearSelectedValues: () => void
}
function getKeyboardDirection(key: string): KeyboardDirection | null {
  if (key === 'ArrowUp') return 'up'
  if (key === 'ArrowDown') return 'down'
  if (key === 'ArrowLeft') return 'left'
  if (key === 'ArrowRight') return 'right'
  return null
}

export function useTableKeyboard({
  rootRef,
  savingOpenRef,
  selection,
  entriesByKey,
  cellManagementEnabled,
  commitEditing,
  closeNotes,
  openEditor,
  clearSelectedValues
}: Options) {
  const handleRootKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.target !== rootRef.current) return

      const activeKey = selection.activeCellKey
      if (!activeKey || !selection.selectedCellKeys.has(activeKey)) return

      const activeEntry = entriesByKey.get(activeKey)
      if (!activeEntry) return
      if (!cellManagementEnabled) return
      if (savingOpenRef.current) return

      const direction = getKeyboardDirection(event.key)
      if (direction) {
        event.preventDefault()
        commitEditing()
        closeNotes()

        if (event.shiftKey) {
          selection.extendActiveRange(direction)
        } else {
          selection.moveActiveCell(direction)
        }

        return
      }

      if (event.key === 'Delete') {
        event.preventDefault()
        commitEditing()
        closeNotes()
        clearSelectedValues()
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
      commitEditing,
      closeNotes,
      rootRef,
      savingOpenRef,
      openEditor,
      selection,
      entriesByKey,
      clearSelectedValues
    ]
  )

  return handleRootKeyDown
}
