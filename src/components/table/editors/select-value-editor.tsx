'use client'

import { useLayoutEffect, useRef, type RefObject } from 'react'

import type { CellValue } from '@/types'
import type { EditingSession } from '../editing/types'
import { EditorPopover } from './editor-popover'
import styles from './editors.module.css'

type SelectValueEditorProps = {
  session: EditingSession
  currentValue: CellValue
  anchorRef: RefObject<HTMLElement>
  tableOwnerId: string
  onChooseValue: (value: CellValue) => void
  onCommit: () => void
  onCancel: () => void
}

export function SelectValueEditor({
  session,
  currentValue,
  anchorRef,
  tableOwnerId,
  onChooseValue,
  onCommit,
  onCancel
}: SelectValueEditorProps) {
  const firstButtonRef = useRef<HTMLButtonElement>(null)
  const editor = session.editor.type === 'select' ? session.editor : null

  useLayoutEffect(() => {
    firstButtonRef.current?.focus()
  }, [session.cellKey])

  if (!editor) return null

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onCancel()
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
      onCommit()
    }
  }

  return (
    <EditorPopover anchorRef={anchorRef} tableOwnerId={tableOwnerId}>
      <div className={styles.panel} role="listbox" onKeyDown={handleKeyDown}>
        <div className={styles.hint}>Пробел - выбрать · Enter - закрыть · Esc - отменить</div>
        {editor.options.length === 0 && (
          <div className={styles.emptyMessage}>Нет доступных вариантов</div>
        )}
        {editor.options.map((option, index) => (
          <button
            key={option.value}
            ref={index === 0 ? firstButtonRef : undefined}
            type="button"
            className={styles.optionButton}
            aria-pressed={currentValue === option.value}
            onClick={() => onChooseValue(option.value)}
          >
            {option.label}
          </button>
        ))}
        <button
          ref={editor.options.length === 0 ? firstButtonRef : undefined}
          type="button"
          className={styles.clearButton}
          aria-pressed={currentValue === null}
          onClick={() => onChooseValue(null)}
        >
          Очистить
        </button>
      </div>
    </EditorPopover>
  )
}
