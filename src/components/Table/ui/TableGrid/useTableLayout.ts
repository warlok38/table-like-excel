'use client'

import { useLayoutEffect, useMemo, useReducer, useState, type RefObject } from 'react'

import type { TableStructure } from '../../model'
import { makeTableLayoutModel, measureTableLayout, type TableLayoutSnapshot } from './tableLayout'

export function useTableLayout(
  tableRef: RefObject<HTMLTableElement>,
  surfaceRef: RefObject<HTMLDivElement>,
  structure: TableStructure
) {
  const model = useMemo(() => makeTableLayoutModel(structure), [structure])
  const [snapshot, setSnapshot] = useState<TableLayoutSnapshot | null>(null)
  const [measurementVersion, requestMeasurement] = useReducer((version) => version + 1, 0)
  const currentSnapshot = snapshot?.structureKey === structure.key ? snapshot : null

  useLayoutEffect(() => {
    const table = tableRef.current
    const surface = surfaceRef.current
    if (!table || !surface) return

    const nextSnapshot = measureTableLayout(table, surface, structure, model)
    if (nextSnapshot) setSnapshot(nextSnapshot)
  }, [measurementVersion, model, structure, surfaceRef, tableRef])

  useLayoutEffect(() => {
    const fonts = document.fonts
    if (!fonts) return

    const handleFontsLoaded = () => {
      setSnapshot(null)
      requestMeasurement()
    }

    fonts.addEventListener('loadingdone', handleFontsLoaded)
    return () => fonts.removeEventListener('loadingdone', handleFontsLoaded)
  }, [])

  return {
    model,
    snapshot: currentSnapshot,
    isMeasuring: currentSnapshot === null
  }
}
