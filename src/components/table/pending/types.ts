import type { CellValue } from '@/types'

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
