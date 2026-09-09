import type { CellCapabilities, CellTable } from '@/types'

export function getCellCapabilities(cell: CellTable): CellCapabilities {
  const allowed = cell.data.editable !== false
  const permissions = cell.data.permissions
  const editor = cell.data.editor
  const canEditValue =
    allowed &&
    editor !== null &&
    editor !== undefined &&
    editor.type !== 'readonly' &&
    permissions?.value !== false
  const canChangeBackground = allowed && permissions?.background !== false
  const canEditNote = allowed && permissions?.note !== false

  return {
    canEditValue,
    canChangeBackground,
    canEditNote,
    isLocked: !canEditValue && !canChangeBackground && !canEditNote
  }
}
