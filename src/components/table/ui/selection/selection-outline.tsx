'use client'

import type { MutableRefObject } from 'react'
import { makeSelectionOutline } from '../../lib/selection-outline'
import type { SelectionRect } from '../../lib/selection-outline'
import styles from '../../table.module.css'

export function SelectionOutline({
  rectsRef,
  geometryVersion,
  selectedCellKeys
}: {
  rectsRef: MutableRefObject<Map<string, SelectionRect>>
  geometryVersion: number
  selectedCellKeys: Set<string>
}) {
  void geometryVersion

  const rects = Array.from(selectedCellKeys)
    .map((cellKey) => rectsRef.current.get(cellKey))
    .filter((rect): rect is SelectionRect => Boolean(rect))
  const path = makeSelectionOutline(rects)

  return (
    <svg className={styles.selectionOutline} aria-hidden="true">
      <path d={path} fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="square" />
    </svg>
  )
}
