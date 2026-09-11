'use client'

import { useLayoutEffect, useState, type RefObject } from 'react'

export type CellContentSize = { width: number; height: number }

// Measure the initial, naturally sized content once per table structure. Values,
// drafts and save responses must never become new column sizing inputs.
export function useCellLayout(tableRef: RefObject<HTMLTableElement>, structure: string) {
  const [layout, setLayout] = useState<{
    structure: string
    sizes: Map<string, CellContentSize>
  } | null>(null)

  useLayoutEffect(() => {
    const table = tableRef.current
    if (!table) return

    const sizes = new Map<string, CellContentSize>()
    table.querySelectorAll<HTMLElement>('[data-cell-content]').forEach((content) => {
      const rect = content.getBoundingClientRect()
      sizes.set(content.dataset.cellContent!, { width: rect.width, height: rect.height })
    })
    setLayout({ structure, sizes })
  }, [structure, tableRef])

  return layout?.structure === structure ? layout.sizes : null
}
