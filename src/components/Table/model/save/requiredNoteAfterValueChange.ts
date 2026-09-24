import type { PendingChanges } from '../changes/pendingChanges'
import { getLoadedNote, getPendingNote, hasOwnPending } from '../changes/pendingChanges'
import type { TableCellEntry } from '../data/tableIndex'

export const REQUIRED_NOTE_AFTER_VALUE_CHANGE_MESSAGE = 'Добавьте примечание для введенных значений'

export const REQUIRED_NOTE_DELETION_MESSAGE = 'Удаление примечания недоступно для этой ячейки'

function normalizeNote(note: string | null): string {
  return note?.trim() ?? ''
}

export function validateRequiredNotes(
  changes: PendingChanges,
  entriesByKey: Map<string, TableCellEntry>
): string | null {
  for (const cellKey of Object.keys(changes.values)) {
    const entry = entriesByKey.get(cellKey)
    if (!entry?.cell.data_status?.requiresNoteAfterValueChange) continue

    if (!hasOwnPending(changes.notes, cellKey)) {
      return REQUIRED_NOTE_AFTER_VALUE_CHANGE_MESSAGE
    }

    const pendingNote = getPendingNote(changes, cellKey)
    const loadedNote = getLoadedNote(entry.cell)
    const normalizedPendingNote = normalizeNote(pendingNote ?? null)

    if (normalizedPendingNote === '' || normalizedPendingNote === normalizeNote(loadedNote)) {
      return REQUIRED_NOTE_AFTER_VALUE_CHANGE_MESSAGE
    }
  }

  for (const [cellKey, pendingNote] of Object.entries(changes.notes)) {
    const entry = entriesByKey.get(cellKey)
    if (!entry?.cell.data_status?.requiresNoteAfterValueChange) continue

    if (normalizeNote(pendingNote) === '') {
      return REQUIRED_NOTE_DELETION_MESSAGE
    }
  }

  return null
}
