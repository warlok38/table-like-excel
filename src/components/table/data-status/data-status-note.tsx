'use client'

import { useState, useRef, useLayoutEffect, useEffect, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import styles from './data-status-note.module.css'

export type DataStatusNoteProps = {
  value: string
  anchorRef: RefObject<HTMLElement>
  tableOwnerId: string
  onClose: () => void
  onChange: (value: string) => void
  readOnly?: boolean
}

export function DataStatusNote({
  value,
  anchorRef,
  tableOwnerId,
  onClose,
  onChange,
  readOnly = false
}: DataStatusNoteProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const noteRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const updatePosition = () => {
      const anchor = anchorRef.current
      if (!anchor) return
      const rect = anchor.getBoundingClientRect()
      setPosition({
        top: rect.top,
        left: rect.right + 2
      })
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [anchorRef])

  useLayoutEffect(() => {
    if (readOnly || !position) {
      return
    }

    const textarea = textareaRef.current
    if (!textarea) {
      return
    }

    textarea.focus()
    textarea.setSelectionRange(textarea.value.length, textarea.value.length)
  }, [position, readOnly])

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node
      if (anchorRef.current?.contains(target)) return
      if (noteRef.current?.contains(target)) return
      onClose()
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [anchorRef, onClose])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  if (!position) return null

  return createPortal(
    <div
      ref={noteRef}
      className={styles.noteContainer}
      style={{ top: position.top, left: position.left }}
      data-table-owner={tableOwnerId}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <textarea
        ref={textareaRef}
        className={styles.textArea}
        rows={3}
        value={value}
        onChange={handleChange}
        readOnly={readOnly}
        aria-label="Текст примечания"
      />
    </div>,
    document.body
  )
}
