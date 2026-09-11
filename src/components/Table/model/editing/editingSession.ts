import type { CellEditor, CellValue } from '../table'
import type { PendingChanges } from '../changes/pendingChanges'

export type EditableCellEditor = Exclude<CellEditor, { type: 'readonly' }>

export type PendingValues = PendingChanges['values']

export type EditStart = { kind: 'current' } | { kind: 'replace'; text: string }

export type EditingSession = {
  cellKey: string
  editor: EditableCellEditor
  draft: string
  initialPending: { exists: boolean; value: CellValue }
}
