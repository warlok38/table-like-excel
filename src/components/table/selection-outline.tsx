'use client'

import { useLayoutEffect, useState, type RefObject } from 'react'
import { makeSelectionOutline } from './helpers/selection-outline'
import styles from './table.module.css'

export function SelectionOutline({
  tableRef,
  selectedCellKeys
}: {
  tableRef: RefObject<HTMLTableElement>
  selectedCellKeys: Set<string>
}) {
  const [path, setPath] = useState('')

  useLayoutEffect(() => {
    const table = tableRef.current
    const wrapper = table?.parentElement
    if (!table || !wrapper) return

    const update = () => {
      const origin = wrapper.getBoundingClientRect()
      const rects = Array.from(table.querySelectorAll<HTMLTableCellElement>('td[data-cell-key]'))
        .filter((cell) => selectedCellKeys.has(cell.dataset.cellKey!))
        .map((cell) => {
          const rect = cell.getBoundingClientRect()
          return {
            left: rect.left - origin.left,
            right: rect.right - origin.left,
            top: rect.top - origin.top,
            bottom: rect.bottom - origin.top
          }
        })
      setPath(makeSelectionOutline(rects))
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(table)
    window.addEventListener('scroll', update, true)
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', update, true)
    }
  }, [selectedCellKeys, tableRef])

  return (
    <svg className={styles.selectionOutline} aria-hidden="true">
      <path d={path} fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="square" />
    </svg>
  )
}
