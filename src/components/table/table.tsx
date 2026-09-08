'use client'

import type { CellTable } from '@/types'
import { makeCellKey } from './helpers'
import { MemoTableCell } from './table-cell'
import styles from './table.module.css'

type TableProps = {
  data: CellTable[][]
  isEditablePage?: boolean | string
  formatCalendare?: string
  isFetching?: boolean
}

export function Table({ data }: TableProps) {
  return (
    <div className={styles.tableContainer}>
      {Array.isArray(data) && data.length > 0 && <TableBody data={data} />}
    </div>
  )
}

function TableBody({ data }: { data: CellTable[][] }) {
  return (
    <table className={styles.table}>
      <tbody className={styles.tbody}>
        {data.map((row, rowIndex) => (
          <tr key={`row-${rowIndex + 1}`} className={styles.tr}>
            {row.map((cell, cellIndex) => (
              <MemoTableCell
                key={makeCellKey(cell, rowIndex, cellIndex)}
                cell={cell}
                rowIndex={rowIndex}
                cellIndex={cellIndex}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
