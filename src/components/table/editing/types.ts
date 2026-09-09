import type { CellEditor, CellValue } from '@/types'

export type EditableCellEditor = Exclude<CellEditor, { type: 'readonly' }>

export type PendingValues = Record<string, CellValue>

export type EditStart = { kind: 'current' } | { kind: 'replace'; text: string }

export type EditingSession = {
  cellKey: string
  editor: EditableCellEditor
  draft: string
  initialPending: { exists: boolean; value: CellValue }
}
