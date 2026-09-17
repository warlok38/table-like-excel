import type { CellCapabilities, CellTable } from './table'

type CellCapabilitiesOptions = {
  dataStatusActionsEnabled?: boolean
}

export function getCellCapabilities(
  cell: CellTable,
  { dataStatusActionsEnabled = true }: CellCapabilitiesOptions = {}
): CellCapabilities {
  const allowed = cell.data.editable !== false
  const dataStatusActionsAllowed = dataStatusActionsEnabled && allowed
  const permissions = cell.data.permissions
  const editor = cell.data.editor
  const canEditValue =
    allowed &&
    editor !== null &&
    editor !== undefined &&
    editor.type !== 'readonly' &&
    permissions?.value !== false
  const canChangeBackground = dataStatusActionsAllowed && permissions?.background !== false
  const canEditNote = dataStatusActionsAllowed && permissions?.note !== false

  return {
    canEditValue,
    canChangeBackground,
    canEditNote,
    isLocked: !canEditValue && !canChangeBackground && !canEditNote
  }
}
