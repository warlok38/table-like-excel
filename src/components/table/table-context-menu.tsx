'use client'

import { useEffect, useRef } from 'react'

import styles from './table.module.css'

type TableContextMenuProps = {
  x: number
  y: number
  hasNote: boolean
  isLocked: boolean
  onAddOrEditNote: () => void
  onDeleteNote: () => void
  onClose: () => void
}

export function TableContextMenu({
  x,
  y,
  hasNote,
  isLocked,
  onAddOrEditNote,
  onDeleteNote,
  onClose
}: TableContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      if (menuRef.current?.contains(event.target as Node)) {
        return
      }

      onClose()
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className={styles.contextMenu}
      style={{ top: y, left: x }}
      role="menu"
      onContextMenu={(event) => event.preventDefault()}
    >
      {hasNote ? (
        <button
          type="button"
          className={styles.contextMenuItem}
          role="menuitem"
          disabled={isLocked}
          onClick={onDeleteNote}
        >
          Удалить примечание
        </button>
      ) : (
        <button
          type="button"
          className={styles.contextMenuItem}
          role="menuitem"
          disabled={isLocked}
          onClick={onAddOrEditNote}
        >
          Добавить примечание
        </button>
      )}
    </div>
  )
}
