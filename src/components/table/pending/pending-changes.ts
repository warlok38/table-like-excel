import type { CellTable, CellValue } from '@/types'
import { getDataStatusBackground } from '../helpers/cell-style'
import type { PendingChanges, PendingChangeSummary } from './types'

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
  return {
    changedCells: countPendingCells(changes),
    operations: countPendingOperations(changes),
    values: Object.keys(changes.values).length,
    backgrounds: Object.keys(changes.backgrounds).length,
    notes: Object.keys(changes.notes).length
  }
}

export function getLoadedBackground(cell: CellTable): string | null {
  return getDataStatusBackground(cell) ?? cell.data.color ?? null
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
  const nextValues = { ...changes.values }

  if (value === loadedCell.value) {
    delete nextValues[cellKey]
  } else {
    nextValues[cellKey] = value
  }

  return { ...changes, values: nextValues }
}

export function setPendingBackgroundChange(
  changes: PendingChanges,
  cellKey: string,
  loadedCell: CellTable,
  background: string | null
): PendingChanges {
  const nextBackgrounds = { ...changes.backgrounds }

  if (background === getLoadedBackground(loadedCell)) {
    delete nextBackgrounds[cellKey]
  } else {
    nextBackgrounds[cellKey] = background
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
