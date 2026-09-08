'use client'

import type { CellTable } from '@/types'
import { isCellLocked, makeCellKey } from './helpers'
import { useTableSelection } from './hooks/use-table-selection'
import { MemoTableCell } from './table-cell'
import styles from './table.module.css'

type TableProps = {
  data: CellTable[][]
  isEditablePage?: boolean | string
  formatCalendare?: string
  isFetching?: boolean
}

export function Table({ data }: TableProps) {
  const selection = useTableSelection(data)

  return (
    <div className={styles.tableContainer} data-is-selecting={selection.isDragging}>
      {Array.isArray(data) && data.length > 0 && <TableBody data={data} selection={selection} />}
    </div>
  )
}

function TableBody({
  data,
  selection
}: {
  data: CellTable[][]
  selection: ReturnType<typeof useTableSelection>
}) {
  return (
    <table className={styles.table}>
      <tbody className={styles.tbody}>
        {data.map((row, rowIndex) => (
          <tr key={`row-${rowIndex + 1}`} className={styles.tr}>
            {row.map((cell, cellIndex) => {
              const cellKey = makeCellKey(cell, rowIndex, cellIndex)

              return (
                <MemoTableCell
                  key={cellKey}
                  cell={cell}
                  cellKey={cellKey}
                  rowIndex={rowIndex}
                  cellIndex={cellIndex}
                  isActive={selection.activeCellKey === cellKey}
                  isSelected={selection.selectedCellKeys.has(cellKey)}
                  isLocked={isCellLocked(cell)}
                  onSelect={selection.selectCell}
                  onExtendSelection={selection.extendRangeToCell}
                />
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
