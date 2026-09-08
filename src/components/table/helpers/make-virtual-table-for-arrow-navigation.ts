import type { CellTable } from '@/types'

export type VirtualTableCell = {
  virtCoord: {
    x: number
    y: number
  }
  matchedCell: {
    col: number
    row: number
    color?: string | null
  } | null
  isEditable: boolean
}

export type VirtualTable = VirtualTableCell[][]

export function makeVirtualTable(
  data: CellTable[][],
  maxRowLengthWithColSpan: number,
  rowCount: number
) {
  if (!Array.isArray(data)) {
    return
  }
  const virtualTable: VirtualTable = []

  for (let i = 0; i < rowCount; i++) {
    virtualTable.push([])
    for (let j = 0; j < maxRowLengthWithColSpan; j++) {
      virtualTable[i].push({ virtCoord: { x: j, y: i }, matchedCell: null, isEditable: false })
    }
  }

  data.forEach((row, idxRow) => {
    row.forEach((cell, idxCol) => {
      const colSpan = cell.data.colspan
      const rowSpan = cell.data.rowspan
      let rowNumber = idxRow
      let colNumber = idxCol
      while (
        virtualTable?.[rowNumber]?.[colNumber]?.matchedCell !== null &&
        colNumber < maxRowLengthWithColSpan
      ) {
        colNumber++
      }
      for (let i = 0; i < rowSpan; i++) {
        for (let j = 0; j < colSpan; j++) {
          if (virtualTable?.[rowNumber + i]?.[colNumber + j]) {
            virtualTable[rowNumber + i][colNumber + j].matchedCell = {
              col: idxCol,
              row: idxRow,
              color: cell.data.color
            }
            virtualTable[rowNumber + i][colNumber + j].isEditable = Boolean(cell.data.editable)
          }
        }
      }
    })
  })
  return virtualTable
}
