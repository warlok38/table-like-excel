import type { CellTable, CellValue } from '../table'
import type { TableCellEntry } from '../data/tableIndex'
import { getLoadedBackground } from './cellBackground'

export type PendingChanges = {
  values: Record<string, CellValue>
  backgrounds: Record<string, string | null>
  notes: Record<string, string | null>
}

export type PendingChangeSummary = {
  changedCells: number
  operations: number
  values: number
  backgrounds: number
  notes: number
}

export const emptyPendingChanges: PendingChanges = {
  values: {},
  backgrounds: {},
  notes: {}
}

export function hasOwnPending<T>(record: Record<string, T>, cellKey: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, cellKey)
}

export function hasPendingChanges(changes: PendingChanges): boolean {
  return (
    Object.keys(changes.values).length > 0 ||
    Object.keys(changes.backgrounds).length > 0 ||
    Object.keys(changes.notes).length > 0
  )
}

export function countPendingOperations(changes: PendingChanges): number {
  return (
    Object.keys(changes.values).length +
    Object.keys(changes.backgrounds).length +
    Object.keys(changes.notes).length
  )
}

export function countPendingCells(changes: PendingChanges): number {
  return new Set([
    ...Object.keys(changes.values),
    ...Object.keys(changes.backgrounds),
    ...Object.keys(changes.notes)
  ]).size
}

export function summarizePendingChanges(changes: PendingChanges): PendingChangeSummary {
  const valueKeys = Object.keys(changes.values)
  const backgroundKeys = Object.keys(changes.backgrounds)
  const noteKeys = Object.keys(changes.notes)

  return {
    changedCells: new Set([...valueKeys, ...backgroundKeys, ...noteKeys]).size,
    operations: valueKeys.length + backgroundKeys.length + noteKeys.length,
    values: valueKeys.length,
    backgrounds: backgroundKeys.length,
    notes: noteKeys.length
  }
}

export function getLoadedNote(cell: CellTable): string | null {
  return cell.data_status?.note?.value ?? null
}

export function getPendingValue(changes: PendingChanges, cellKey: string): CellValue | undefined {
  return hasOwnPending(changes.values, cellKey) ? changes.values[cellKey] : undefined
}

export function getPendingBackground(
  changes: PendingChanges,
  cellKey: string
): string | null | undefined {
  return hasOwnPending(changes.backgrounds, cellKey) ? changes.backgrounds[cellKey] : undefined
}

export function getPendingNote(
  changes: PendingChanges,
  cellKey: string
): string | null | undefined {
  return hasOwnPending(changes.notes, cellKey) ? changes.notes[cellKey] : undefined
}

export function isValuePending(changes: PendingChanges, cellKey: string): boolean {
  return hasOwnPending(changes.values, cellKey)
}

export function isBackgroundPending(changes: PendingChanges, cellKey: string): boolean {
  return hasOwnPending(changes.backgrounds, cellKey)
}

export function isNotePending(changes: PendingChanges, cellKey: string): boolean {
  return hasOwnPending(changes.notes, cellKey)
}

export function setPendingValueChange(
  changes: PendingChanges,
  cellKey: string,
  loadedCell: CellTable,
  value: CellValue
): PendingChanges {
  return setPendingValueChanges(changes, [{ key: cellKey, cell: loadedCell }], value)
}

export function setPendingValueChanges(
  changes: PendingChanges,
  entries: Array<Pick<TableCellEntry, 'key' | 'cell'>>,
  value: CellValue
): PendingChanges {
  let changed = false
  const nextValues = { ...changes.values }

  entries.forEach((entry) => {
    const hadPending = hasOwnPending(changes.values, entry.key)

    if (value === entry.cell.value) {
      if (hadPending) {
        delete nextValues[entry.key]
        changed = true
      }
    } else if (!hadPending || changes.values[entry.key] !== value) {
      nextValues[entry.key] = value
      changed = true
    }
  })

  if (!changed) {
    return changes
  }

  return { ...changes, values: nextValues }
}

export function setPendingBackgroundChange(
  changes: PendingChanges,
  cellKey: string,
  loadedCell: CellTable,
  background: string | null
): PendingChanges {
  return setPendingBackgroundChanges(changes, [{ key: cellKey, cell: loadedCell }], background)
}

export function setPendingBackgroundChanges(
  changes: PendingChanges,
  entries: Array<Pick<TableCellEntry, 'key' | 'cell'>>,
  background: string | null
): PendingChanges {
  let changed = false
  const nextBackgrounds = { ...changes.backgrounds }

  entries.forEach((entry) => {
    const hadPending = hasOwnPending(changes.backgrounds, entry.key)

    if (background === getLoadedBackground(entry.cell)) {
      if (hadPending) {
        delete nextBackgrounds[entry.key]
        changed = true
      }
    } else if (!hadPending || changes.backgrounds[entry.key] !== background) {
      nextBackgrounds[entry.key] = background
      changed = true
    }
  })

  if (!changed) {
    return changes
  }

  return { ...changes, backgrounds: nextBackgrounds }
}

export function setPendingNoteChange(
  changes: PendingChanges,
  cellKey: string,
  loadedCell: CellTable,
  note: string | null
): PendingChanges {
  const normalizedNote = note && note.length > 0 ? note : null
  const nextNotes = { ...changes.notes }

  if (normalizedNote === getLoadedNote(loadedCell)) {
    delete nextNotes[cellKey]
  } else {
    nextNotes[cellKey] = normalizedNote
  }

  return { ...changes, notes: nextNotes }
}
