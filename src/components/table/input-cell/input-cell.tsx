'use client'

import { ChangeEventHandler, memo, type Dispatch, type SetStateAction, useState } from 'react'
import cn from 'classnames'

import type { FiltersCell } from '@/types'
import styles from './inut-cell.module.css'

export type InputTdProps = {
  filters: FiltersCell
  parameter_id: string | null | undefined
  comments_id: string | null | undefined
  tdata_id: string | null
  renderInput: boolean
  formatted_value: string | number | null
  timestamp?: string | null
  production_date: string | null
  x: number
  y: number
  cellIndex: number
  rowIndex: number
  changed?: boolean
  backgroundColor?: string | null
  setTimestampHighlighted: Dispatch<SetStateAction<string | null>>
}

export function InputCell({ comments_id, formatted_value, changed }: InputTdProps) {
  const [value, setValue] = useState(formatted_value ?? '')

  const onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = (event) => {
    setValue(event.target.value)
  }

  if (comments_id) {
    return (
      <textarea className={styles.textArea} rows={1} value={String(value)} onChange={onChange} />
    )
  }

  return (
    <input
      className={cn(styles.input, { [styles.changed]: changed })}
      type="text"
      value={String(value)}
      onChange={onChange}
    />
  )
}

export const MemoInputCell = memo(InputCell)
