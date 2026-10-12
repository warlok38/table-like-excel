import { findRowAtOffset, makeOffsets, type TableLayoutSnapshot } from './tableLayout'

export type TableScrollAnchor = {
  structureKey: string
  rowIndex: number
  offset: number
}

export function captureTableScrollAnchor(
  snapshot: TableLayoutSnapshot,
  scrollTop: number
): TableScrollAnchor {
  const rowIndex = findRowAtOffset(snapshot.rowOffsets, scrollTop)
  return {
    structureKey: snapshot.structureKey,
    rowIndex,
    offset: Math.max(0, scrollTop - (snapshot.rowOffsets[rowIndex] ?? 0))
  }
}

export function resolveTableScrollAnchor(
  snapshot: TableLayoutSnapshot,
  anchor: TableScrollAnchor
): number {
  const offset = Math.min(anchor.offset, Math.max(0, snapshot.rowHeights[anchor.rowIndex] - 0.1))
  return (snapshot.rowOffsets[anchor.rowIndex] ?? 0) + offset
}

export function updateTableRowHeights(
  snapshot: TableLayoutSnapshot,
  rows: ReadonlyMap<number, HTMLTableRowElement>,
  offscreenHeights: ReadonlyMap<number, number> = new Map()
): TableLayoutSnapshot {
  const rowHeights = [...snapshot.rowHeights]
  let changed = false
  offscreenHeights.forEach((height, index) => {
    if (index >= rowHeights.length || Math.abs(height - rowHeights[index]) <= 0.1) return
    rowHeights[index] = height
    changed = true
  })
  rows.forEach((row, index) => {
    if (index >= rowHeights.length) return
    const height = row.getBoundingClientRect().height
    if (Math.abs(height - rowHeights[index]) <= 0.1) return
    rowHeights[index] = height
    changed = true
  })
  if (!changed) return snapshot

  const rowOffsets = makeOffsets(rowHeights)
  const cellRects = new Map(snapshot.cellRects)
  cellRects.forEach((rect, key) => {
    const start = snapshot.rowByCellKey.get(key)!
    const end = snapshot.rowEndByCellKey.get(key)!
    cellRects.set(key, { ...rect, top: rowOffsets[start], bottom: rowOffsets[end + 1] })
  })
  return {
    ...snapshot,
    rowHeights,
    rowOffsets,
    cellRects,
    totalHeight: rowOffsets[rowOffsets.length - 1] ?? 0
  }
}
