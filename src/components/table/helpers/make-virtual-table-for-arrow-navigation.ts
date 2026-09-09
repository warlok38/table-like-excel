import type { CellTable } from '@/types'
import { makeCellKey } from './cell-key'

export type KeyboardDirection = 'up' | 'down' | 'left' | 'right'

export type VirtualTableCell = {
  key: string
  rowIndex: number
  cellIndex: number
  visualRow: number
  visualCol: number
  rowSpan: number
  colSpan: number
  cell: CellTable
}

export type VirtualTableMap = {
  grid: Array<Array<string | null>>
  cellsByKey: Map<string, VirtualTableCell>
}

type CellBounds = {
  top: number
  bottom: number
  left: number
  right: number
}

function ensureGridCell(grid: Array<Array<string | null>>, row: number, col: number) {
  while (grid.length <= row) {
    grid.push([])
  }

  while (grid[row].length <= col) {
    grid[row].push(null)
  }
}

function getKeyAt(grid: Array<Array<string | null>>, row: number, col: number): string | null {
  return grid[row]?.[col] ?? null
}

function getCellBounds(cell: VirtualTableCell): CellBounds {
  return {
    top: cell.visualRow,
    bottom: cell.visualRow + cell.rowSpan - 1,
    left: cell.visualCol,
    right: cell.visualCol + cell.colSpan - 1
  }
}

export function makeVirtualTableMap(data: CellTable[][]): VirtualTableMap {
  const grid: Array<Array<string | null>> = []
  const cellsByKey = new Map<string, VirtualTableCell>()

  data.forEach((row, rowIndex) => {
    ensureGridCell(grid, rowIndex, 0)

    row.forEach((cell, cellIndex) => {
      let visualCol = 0

      while (getKeyAt(grid, rowIndex, visualCol) !== null) {
        visualCol += 1
      }

      const key = makeCellKey(cell, rowIndex, cellIndex)
      const rowSpan = Math.max(1, cell.data.rowspan)
      const colSpan = Math.max(1, cell.data.colspan)

      cellsByKey.set(key, {
        key,
        rowIndex,
        cellIndex,
        visualRow: rowIndex,
        visualCol,
        rowSpan,
        colSpan,
        cell
      })

      for (let rowOffset = 0; rowOffset < rowSpan; rowOffset += 1) {
        for (let colOffset = 0; colOffset < colSpan; colOffset += 1) {
          const targetRow = rowIndex + rowOffset
          const targetCol = visualCol + colOffset
          ensureGridCell(grid, targetRow, targetCol)
          grid[targetRow][targetCol] = key
        }
      }
    })
  })

  return { grid, cellsByKey }
}

export function getNextCellKey(
  map: VirtualTableMap,
  currentKey: string,
  direction: KeyboardDirection
): string {
  const currentCell = map.cellsByKey.get(currentKey)
  if (!currentCell) return currentKey

  const bounds = getCellBounds(currentCell)
  const maxRow = map.grid.length - 1
  const maxCol = Math.max(0, ...map.grid.map((row) => row.length)) - 1

  if (direction === 'up' || direction === 'down') {
    const rowStart = direction === 'up' ? bounds.top - 1 : bounds.bottom + 1
    const rowEnd = direction === 'up' ? 0 : maxRow
    const rowStep = direction === 'up' ? -1 : 1

    for (let row = rowStart; direction === 'up' ? row >= rowEnd : row <= rowEnd; row += rowStep) {
      for (let col = bounds.left; col <= bounds.right; col += 1) {
        const nextKey = getKeyAt(map.grid, row, col)
        if (nextKey && nextKey !== currentKey) return nextKey
      }
    }

    return currentKey
  }

  const colStart = direction === 'left' ? bounds.left - 1 : bounds.right + 1
  const colEnd = direction === 'left' ? 0 : maxCol
  const colStep = direction === 'left' ? -1 : 1

  for (let col = colStart; direction === 'left' ? col >= colEnd : col <= colEnd; col += colStep) {
    for (let row = bounds.top; row <= bounds.bottom; row += 1) {
      const nextKey = getKeyAt(map.grid, row, col)
      if (nextKey && nextKey !== currentKey) return nextKey
    }
  }

  return currentKey
}

export function getCellKeysInVirtualRange(
  map: VirtualTableMap,
  fromKey: string,
  toKey: string
): string[] {
  const fromCell = map.cellsByKey.get(fromKey)
  const toCell = map.cellsByKey.get(toKey)

  if (!fromCell || !toCell) {
    return []
  }

  const fromBounds = getCellBounds(fromCell)
  const toBounds = getCellBounds(toCell)
  const top = Math.min(fromBounds.top, toBounds.top)
  const bottom = Math.max(fromBounds.bottom, toBounds.bottom)
  const left = Math.min(fromBounds.left, toBounds.left)
  const right = Math.max(fromBounds.right, toBounds.right)
  const keys = new Set<string>()

  for (let row = top; row <= bottom; row += 1) {
    for (let col = left; col <= right; col += 1) {
      const key = getKeyAt(map.grid, row, col)
      if (key) keys.add(key)
    }
  }

  return Array.from(keys)
}
