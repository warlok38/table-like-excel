'use client'

import { useLayoutEffect, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'

import styles from './CellValueEditor.module.css'

type EditorPopoverProps = {
  anchorRef: RefObject<HTMLElement>
  tableOwnerId: string
  children: ReactNode
}

export function EditorPopover({ anchorRef, tableOwnerId, children }: EditorPopoverProps) {
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(
    null
  )

  useLayoutEffect(() => {
    const updatePosition = () => {
      const anchor = anchorRef.current
      if (!anchor) return

      const rect = anchor.getBoundingClientRect()
      const panelWidth = Math.max(rect.width, 220)
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - panelWidth - 8)
      const spaceBelow = window.innerHeight - rect.bottom
      const top = spaceBelow < 220 ? Math.max(8, rect.top - 220) : rect.bottom + 4

      setPosition({ top, left, width: panelWidth })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [anchorRef])

  if (!position) return null

  return createPortal(
    <div
      className={styles.popover}
      style={{ top: position.top, left: position.left, minWidth: position.width }}
      data-table-owner={tableOwnerId}
      data-value-editor-owner={tableOwnerId}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  )
}
