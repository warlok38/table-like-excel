import type { CellEditor, CellValue } from '../types'
import type { PendingChanges } from './pending.types'

export type EditableCellEditor = Exclude<CellEditor, { type: 'readonly' }>

export type PendingValues = PendingChanges['values']

export type EditStart = { kind: 'current' } | { kind: 'replace'; text: string }

export type EditingSession = {
  cellKey: string
  editor: EditableCellEditor
  draft: string
  initialPending: { exists: boolean; value: CellValue }
}
