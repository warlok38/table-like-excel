'use client'

import { useLayoutEffect, useRef } from 'react'

import type { CellValue } from '../../types'
import type { EditingSession } from '../../model/editing.types'
import styles from './editors.module.css'

type SelectValueEditorProps = {
  session: EditingSession
  currentValue: CellValue
  tableOwnerId: string
  onChooseValue: (value: CellValue) => void
  onCommit: () => void
  onCancel: () => void
}

export function SelectValueEditor({
  session,
  currentValue,
  tableOwnerId,
  onChooseValue,
  onCommit,
  onCancel
}: SelectValueEditorProps) {
  const selectRef = useRef<HTMLSelectElement>(null)
  const editor = session.editor.type === 'select' ? session.editor : null

  useLayoutEffect(() => {
    const select = selectRef.current
    if (!select) return

    select.focus({ preventScroll: true })
    try {
      select.showPicker?.()
    } catch {
      // Keep the native select focusable even when automatic opening is unavailable.
    }
  }, [session.cellKey])

  if (!editor) return null

  // Index values keep null distinct from an option whose value is an empty string.
  const selectedIndex = editor.options.findIndex((option) => option.value === currentValue)

  return (
    <select
      ref={selectRef}
      className={styles.nativeSelect}
      aria-label="Выбрать значение"
      data-table-interactive="true"
      data-table-owner={tableOwnerId}
      data-value-editor-owner={tableOwnerId}
      value={selectedIndex < 0 ? '' : String(selectedIndex)}
      onChange={(event) => {
        const index = event.currentTarget.value
        onChooseValue(index === '' ? null : editor.options[Number(index)].value)
        onCommit()
      }}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        event.stopPropagation()
        if (event.key === 'Escape') {
          event.preventDefault()
          onCancel()
        } else if (event.key === 'Enter') {
          event.preventDefault()
          onCommit()
        }
      }}
    >
      <option value="">Очистить</option>
      {editor.options.length === 0 && <option disabled>Нет доступных вариантов</option>}
      {editor.options.map((option, index) => (
        <option key={option.value} value={String(index)}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
