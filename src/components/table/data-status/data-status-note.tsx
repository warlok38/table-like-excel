'use client'

import { useState, useRef, useLayoutEffect, useEffect, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import styles from './data-status-note.module.css'

export type DataStatusNoteProps = {
  note: string | null
  anchorRef: RefObject<HTMLElement>
  onClose: () => void
}

export function DataStatusNote({ note, anchorRef, onClose }: DataStatusNoteProps) {
  const [value, setValue] = useState(note ?? '')
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const noteRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node
      if (anchorRef.current?.contains(target)) return
      onClose()
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [anchorRef, onClose])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
  }

  if (!position) return null

  return createPortal(
    <div
      ref={noteRef}
      className={styles.noteContainer}
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <textarea className={styles.textArea} rows={3} value={value} onChange={handleChange} />
    </div>,
    document.body
  )
}
