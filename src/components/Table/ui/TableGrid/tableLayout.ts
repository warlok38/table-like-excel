import type { TableStructure } from '../../model'
import { makeVirtualTableMap } from '../../model/selection/virtualTable'
import type { SelectionRect } from '../SelectionOutline/makeSelectionOutline'

export type CellContentSize = { width: number; height: number }

export type RowSpanInterval = {
  start: number
  end: number
}

export type TableLayoutModel = {
  visualColumnCount: number
  rowByCellKey: Map<string, number>
  rowSpanIntervals: RowSpanInterval[]
  pinnedRowEnd: number
}

export type TableLayoutSnapshot = TableLayoutModel & {
  structureKey: string
  rowHeights: number[]
  rowOffsets: number[]
  columnWidths: number[]
  contentSizes: Map<string, CellContentSize>
  cellRects: Map<string, SelectionRect>
  totalHeight: number
  totalWidth: number
}

export type VirtualRowWindow = {
  pinnedRowEnd: number
  start: number
  end: number
  paddingTop: number
  paddingBottom: number
}

export const VIRTUALIZATION_ROW_THRESHOLD = 100
export const VIRTUALIZATION_OVERSCAN = 8

export function makeTableLayoutModel(structure: TableStructure): TableLayoutModel {
  const virtualMap = makeVirtualTableMap(structure.rows)
  const rowByCellKey = new Map<string, number>()
  const rowSpanIntervals: RowSpanInterval[] = []
  const lastRow = structure.rows.length - 1

  virtualMap.cellsByKey.forEach((cell, key) => {
    rowByCellKey.set(key, cell.rowIndex)

    if (cell.rowSpan > 1 && lastRow >= 0) {
      rowSpanIntervals.push({
        start: cell.rowIndex,
        end: Math.min(lastRow, cell.rowIndex + cell.rowSpan - 1)
      })
    }
  })

  rowSpanIntervals.sort((left, right) => left.start - right.start || left.end - right.end)

  return {
    visualColumnCount: Math.max(0, virtualMap.maxCol + 1),
    rowByCellKey,
    rowSpanIntervals,
    pinnedRowEnd: lastRow >= 0 ? expandRowRange(0, 0, rowSpanIntervals).end : -1
  }
}

export function measureTableLayout(
  table: HTMLTableElement,
  surface: HTMLElement,
  structure: TableStructure,
  model: TableLayoutModel
): TableLayoutSnapshot | null {
  const rowElements = Array.from(
    table.querySelectorAll<HTMLTableRowElement>('tr[data-table-row-index]')
  )
  const probeCells = Array.from(
    table.querySelectorAll<HTMLTableCellElement>('[data-column-probe-cell]')
  )

  if (rowElements.length !== structure.rows.length) return null
  if (probeCells.length !== model.visualColumnCount) return null

  const rowHeights = rowElements.map((row) => row.getBoundingClientRect().height)
  const rowOffsets = makeOffsets(rowHeights)
  const columnWidths = probeCells.map((cell) => cell.getBoundingClientRect().width)
  const origin = surface.getBoundingClientRect()
  const contentSizes = new Map<string, CellContentSize>()
  const cellRects = new Map<string, SelectionRect>()

  table.querySelectorAll<HTMLElement>('[data-cell-content]').forEach((content) => {
    const cellKey = content.dataset.cellContent
    if (!cellKey) return
    const rect = content.getBoundingClientRect()
    contentSizes.set(cellKey, {
      width: rect.width,
      height: rect.height > 0 ? rect.height : content.scrollHeight
    })
  })

  table.querySelectorAll<HTMLTableCellElement>('[data-cell-key]').forEach((cell) => {
    const cellKey = cell.dataset.cellKey
    if (!cellKey) return
    const rect = cell.getBoundingClientRect()
    cellRects.set(cellKey, {
      left: rect.left - origin.left,
      right: rect.right - origin.left,
      top: rect.top - origin.top,
      bottom: rect.bottom - origin.top
    })
  })

  return {
    ...model,
    structureKey: structure.key,
    rowHeights,
    rowOffsets,
    columnWidths,
    contentSizes,
    cellRects,
    totalHeight: rowOffsets[rowOffsets.length - 1] ?? 0,
    totalWidth: columnWidths.reduce((sum, width) => sum + width, 0)
  }
}

export function calculateVirtualRowWindow(
  snapshot: TableLayoutSnapshot,
  scrollTop: number,
  viewportHeight: number,
  overscan = VIRTUALIZATION_OVERSCAN
): VirtualRowWindow {
  const rowCount = snapshot.rowHeights.length
  if (rowCount === 0) {
    return { pinnedRowEnd: -1, start: 0, end: -1, paddingTop: 0, paddingBottom: 0 }
  }

  const visibleStart = findRowAtOffset(snapshot.rowOffsets, scrollTop)
  const visibleEnd = findRowAtOffset(
    snapshot.rowOffsets,
    Math.max(scrollTop, scrollTop + Math.max(0, viewportHeight) - 0.1)
  )
  const requestedStart = Math.max(snapshot.pinnedRowEnd + 1, visibleStart - overscan)
  const requestedEnd = Math.min(rowCount - 1, visibleEnd + overscan)
  const expanded = expandRowRange(requestedStart, requestedEnd, snapshot.rowSpanIntervals)
  const start = Math.max(snapshot.pinnedRowEnd + 1, expanded.start)
  const end = Math.max(start - 1, Math.min(rowCount - 1, expanded.end))
  const prefixOffset = snapshot.rowOffsets[snapshot.pinnedRowEnd + 1] ?? 0

  return {
    pinnedRowEnd: snapshot.pinnedRowEnd,
    start,
    end,
    paddingTop: Math.max(0, (snapshot.rowOffsets[start] ?? prefixOffset) - prefixOffset),
    paddingBottom: Math.max(0, snapshot.totalHeight - (snapshot.rowOffsets[end + 1] ?? 0))
  }
}

export function isRowRendered(window: VirtualRowWindow, rowIndex: number): boolean {
  return rowIndex <= window.pinnedRowEnd || (rowIndex >= window.start && rowIndex <= window.end)
}

function makeOffsets(sizes: number[]): number[] {
  const offsets = [0]
  for (const size of sizes) {
    offsets.push(offsets[offsets.length - 1] + size)
  }
  return offsets
}

function findRowAtOffset(offsets: number[], offset: number): number {
  const rowCount = Math.max(0, offsets.length - 1)
  if (rowCount === 0) return 0

  const clamped = Math.max(0, Math.min(offset, Math.max(0, offsets[rowCount] - 0.1)))
  let low = 0
  let high = rowCount

  while (low < high) {
    const middle = (low + high) >>> 1
    if (offsets[middle + 1] <= clamped) low = middle + 1
    else high = middle
  }

  return Math.min(rowCount - 1, low)
}

function expandRowRange(
  initialStart: number,
  initialEnd: number,
  intervals: RowSpanInterval[]
): RowSpanInterval {
  let start = initialStart
  let end = initialEnd
  let changed = true

  while (changed) {
    changed = false
    for (const interval of intervals) {
      if (interval.start > end) break
      if (interval.end < start) continue

      const nextStart = Math.min(start, interval.start)
      const nextEnd = Math.max(end, interval.end)
      if (nextStart !== start || nextEnd !== end) {
        start = nextStart
        end = nextEnd
        changed = true
      }
    }
  }

  return { start, end }
}
