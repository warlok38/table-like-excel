import cn from 'classnames'

import { getCellCapabilities, type CellTable } from '../../model'
import styles from './TableCell.module.css'

export type CellDisplayMode = 'wrap' | 'single-line' | 'multiline'

export function getCellDisplayMode(cell: CellTable): CellDisplayMode {
  const type = cell.data.editor?.type
  if (type === 'textarea') return 'multiline'
  if (getCellCapabilities(cell).canEditValue && (type === 'text' || type === 'number')) {
    return 'single-line'
  }
  return 'wrap'
}

export function getCellContentClass(cell: CellTable, mode: CellDisplayMode): string {
  const value = cell.formatted_value
  const isNumeric = value !== null && value !== '' && !Number.isNaN(Number(value))
  return cn(styles.constCell, {
    [styles.nowrap]: isNumeric,
    [styles.preWrap]: mode === 'multiline',
    [styles.singleLine]: mode === 'single-line'
  })
}

export function getMeasurementCellClass(cell: CellTable): string {
  return cn(styles.td, { [styles.constCellComments]: cell.data.comments_id })
}
