import { getCellCapabilities } from '../cellCapabilities'
import { setPendingValueChange, type PendingChanges } from '../changes/pendingChanges'
import type { TableCellEntry } from '../data/tableIndex'
import type { EditingSession } from './editingSession'
import { normalizeCommittedValue } from './valueConversion'

export function getChangesWithEditingDraft(
  changes: PendingChanges,
  session: EditingSession | null,
  entriesByKey: Map<string, TableCellEntry>
): PendingChanges {
  if (!session || session.editor.type === 'select' || session.editor.type === 'date') {
    return changes
  }

  const entry = entriesByKey.get(session.cellKey)
  if (!entry || !getCellCapabilities(entry.cell).canEditValue) return changes

  return setPendingValueChange(
    changes,
    session.cellKey,
    entry.cell,
    normalizeCommittedValue(session.draft, session.editor)
  )
}
