'use client'

import { useMemo, type MutableRefObject } from 'react'
import { makeSelectionOutline } from './make-selection-outline'
import type { SelectionRect } from './make-selection-outline'
import styles from './selection-outline.module.css'

export function SelectionOutline({
  rectsRef,
  geometryVersion,
  selectedCellKeys
}: {
  rectsRef: MutableRefObject<Map<string, SelectionRect>>
  geometryVersion: number
  selectedCellKeys: Set<string>
}) {
  const path = useMemo(() => {
    void geometryVersion
    const rects = Array.from(selectedCellKeys)
      .map((key) => rectsRef.current.get(key))
      .filter((rect): rect is SelectionRect => Boolean(rect))
    return makeSelectionOutline(rects)
  }, [selectedCellKeys, geometryVersion, rectsRef])

  return (
    <svg className={styles.selectionOutline} aria-hidden="true">
      <path d={path} fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="square" />
    </svg>
  )
}
