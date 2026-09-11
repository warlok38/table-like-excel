'use client'

import { useEffect, useRef } from 'react'

import styles from './TableContextMenu.module.css'

type TableContextMenuProps = {
  x: number
  y: number
  hasNote: boolean
  canEditNote: boolean
  showUnavailableActions: boolean
  onAddNote: () => void
  onEditNote: () => void
  onDeleteNote: () => void
  onClose: () => void
}

export function TableContextMenu({
  x,
  y,
  hasNote,
  canEditNote,
  showUnavailableActions,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onClose
}: TableContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  let menuContent

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

  if (showUnavailableActions) {
    menuContent = (
      <button type="button" className={styles.contextMenuUnavailableItem} role="menuitem" disabled>
        Действия недоступны
      </button>
    )
  } else if (hasNote) {
    menuContent = (
      <>
        <button
          type="button"
          className={styles.contextMenuItem}
          role="menuitem"
          disabled={!canEditNote}
          onClick={onEditNote}
        >
          Изменить примечание
        </button>
        <button
          type="button"
          className={styles.contextMenuItem}
          role="menuitem"
          disabled={!canEditNote}
          onClick={onDeleteNote}
        >
          Удалить примечание
        </button>
      </>
    )
  } else {
    menuContent = (
      <button
        type="button"
        className={styles.contextMenuItem}
        role="menuitem"
        disabled={!canEditNote}
        onClick={onAddNote}
      >
        Добавить примечание
      </button>
    )
  }

  return (
    <div
      ref={menuRef}
      className={styles.contextMenu}
      style={{ top: y, left: x }}
      role="menu"
      onContextMenu={(event) => event.preventDefault()}
    >
      {menuContent}
    </div>
  )
}
